import { $TSContext, $TSMeta, pathManager, stateManager } from 'amplify-cli-core';
import archiver from 'archiver';
import crypto from 'crypto';
import { hashElement, HashElementOptions } from 'folder-hash';
import fs from 'fs-extra';
import glob from 'glob';
import globby from 'globby';
import _ from 'lodash';
import path from 'path';
import { Packager, PackageRequestMeta } from '../types/packaging-types';
import { categoryName } from './constants';
import { getLayerPath, loadStoredLayerParameters } from './layerHelpers';
import { updateLayerArtifacts } from './storeResources';

/**
 * Packages lambda  layer  code and artifacts into a lambda-compatible .zip file
 */
export const packageLayer: Packager = async (context, resource) => {
  const previousHash = loadPreviousLayerHash(resource.resourceName);
  const currentHash = await ensureLayerVersion(context, resource.resourceName, previousHash);
  return zipLayer(context, resource, currentHash);
};

export function loadPreviousLayerHash(layerName: string): string {
  const meta: $TSMeta = stateManager.getMeta();
  const previousHash = _.get(meta, [categoryName, layerName, 'versionHash'], undefined);
  return previousHash;
}

// hashes all of the layer contents as well as the files in the layer path (CFN, parameters, etc)
export const hashLayerResource = async (layerPath: string): Promise<string> => {
  return (await globby(['*'], { cwd: layerPath }))
    .map(filePath => fs.readFileSync(path.join(layerPath, filePath), 'utf8'))
    .reduce((acc, it) => acc.update(it), crypto.createHash('sha256'))
    .update(await hashLayerVersionContents(layerPath))
    .digest('base64');
};

// hashes just the content that will be zipped into the layer version.
// for efficiency, it only hashes package.json files in the node_modules folder of nodejs layers
export const hashLayerVersionContents = async (layerPath: string): Promise<string> => {
  // TODO load paths from layer-runtimes.json
  const nodePath = path.join(layerPath, 'lib', 'nodejs');
  const nodeHashOptions = {
    files: {
      include: ['package.json'],
    },
  };
  const pyPath = path.join(layerPath, 'lib', 'python');
  const optPath = path.join(layerPath, 'opt');

  const joinedHashes = (await Promise.all([safeHash(nodePath, nodeHashOptions), safeHash(pyPath), safeHash(optPath)])).join();

  return crypto.createHash('sha256').update(joinedHashes).digest('base64');
};

async function zipLayer(context: $TSContext, resource: PackageRequestMeta, hash: string) {
  const zipFilename = 'latest-build.zip';
  const layerName = resource.resourceName;
  const layerDirPath = path.join(pathManager.getBackendDirPath(), resource.category, layerName);
  const distDir = path.join(layerDirPath, 'dist');
  fs.ensureDirSync(distDir);
  const destination = path.join(distDir, zipFilename);
  const zip = archiver.create('zip');
  const output = fs.createWriteStream(destination);

  return new Promise<{ zipFilePath: string; zipFilename: string }>((resolve, reject) => {
    output.on('close', () => {
      // check zip size is less than 250MB
      if (validFilesize(destination)) {
        const zipName = `${layerName}-build.zip`;
        context.amplify.updateAmplifyMetaAfterPackage(resource, zipName, { resourceKey: 'versionHash', hashValue: hash });
        resolve({ zipFilePath: destination, zipFilename: zipName });
      } else {
        reject(new Error('File size greater than 250MB'));
      }
    });
    output.on('error', () => {
      reject(new Error('Failed to zip code.'));
    });

    const libGlob = glob.sync(path.join(layerDirPath, 'lib', '*'));
    const optPath = path.join(layerDirPath, 'opt');

    let conflicts: string[] = [];
    libGlob.forEach(lib => {
      const basename = path.basename(lib);
      if (fs.pathExistsSync(path.join(optPath, basename))) {
        conflicts.push(basename);
      }
    });
    if (conflicts.length > 0) {
      const libs = conflicts.map(lib => `"/${lib}"`).join(', ');
      const plural = conflicts.length > 1 ? 'ies' : 'y';
      context.print.warning(
        `${libs} sub director${plural} found in both "/lib" and "/opt". These folders will be merged and the files in "/opt" will take precedence if a conflict exists.`,
      );
    }

    zip.pipe(output);
    [optPath, ...libGlob]
      .filter(folder => fs.lstatSync(folder).isDirectory())
      .forEach(folder =>
        zip.directory(
          folder,
          // opt files need to be in the root of the zipped dir
          path.basename(folder) === 'opt' ? false : path.basename(folder),
        ),
      );
    zip.finalize();
  });
}

// Check hash results for content changes, bump version if so
async function ensureLayerVersion(context: $TSContext, layerName: string, previousHash: string) {
  const currentHash = await hashLayerVersionContents(getLayerPath(layerName));
  const isNewVersion = previousHash !== currentHash;
  if (isNewVersion) {
    if (previousHash) {
      context.print.success(`Content changes in Lambda layer ${layerName} detected.`);
      context.print.warning('Note: You need to run "amplify update function" to configure your functions with the latest layer version.');
    }
  }

  const layerParameters = loadStoredLayerParameters(context, layerName);
  await updateLayerArtifacts(context, layerParameters, { layerParams: false });
  return currentHash;
}

// wrapper around hashElement that will return an empty string if the path does not exist
const safeHash = async (path: string, opts?: HashElementOptions): Promise<string> => {
  if (fs.pathExistsSync(path)) {
    return (
      await hashElement(path, opts).catch(() => {
        throw new Error(`An error occurred hashing directory ${path}`);
      })
    ).hash;
  }
  return '';
};

function validFilesize(path: string, maxSize = 250) {
  try {
    const { size } = fs.statSync(path);
    const fileSize = Math.round(size / 1024 ** 2);
    return fileSize < maxSize;
  } catch (error) {
    return new Error(`Calculating file size failed: ${path}`);
  }
}
