import archiver from 'archiver';
import fs from 'fs-extra';
import glob from 'glob';
import { prompt } from 'inquirer';
import path from 'path';
import _ from 'lodash';
import { hashElement } from 'folder-hash';
import { pathManager } from 'amplify-cli-core';
import { FunctionDependency } from 'amplify-function-plugin-interface';
import { ServiceName, provider } from './constants';
import { previousPermissionsQuestion } from './layerHelpers';
import {
  getLayerMetadataFactory,
  isMultiEnvLayer,
  Permission,
  PrivateLayer,
  LayerParameters,
  LayerMetadata,
  LayerRuntime,
} from './layerParams';
import { getLayerRuntimes } from './layerRuntimes';
import crypto from 'crypto';
import { updateLayerArtifacts } from './storeResources';
import globby from 'globby';

export async function packageLayer(context, resource: Resource) {
  await ensureLayerVersion(context, resource.resourceName);
  return zipLayer(context, resource);
}

async function zipLayer(context, resource: Resource) {
  const zipFilename = 'latest-build.zip';
  const layerName = resource.resourceName;
  const layerDirPath = path.join(pathManager.getBackendDirPath(), resource.category, layerName);
  const distDir = path.join(layerDirPath, 'dist');
  fs.ensureDirSync(distDir);
  const destination = path.join(distDir, zipFilename);
  const zip = archiver.create('zip');
  const output = fs.createWriteStream(destination);

  return new Promise((resolve, reject) => {
    output.on('close', () => {
      // check zip size is less than 250MB
      if (validFilesize(destination)) {
        const zipName = `${layerName}-build.zip`;
        context.amplify.updateAmplifyMetaAfterPackage(resource, zipName);
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
async function ensureLayerVersion(context: any, layerName: string) {
  const layerState = getLayerMetadataFactory(context)(layerName);
  const isNewVersion = await layerState.syncVersions();
  const latestVersion = layerState.getLatestVersion();
  if (isNewVersion) {
    context.print.success(`Content changes in Lambda layer ${layerName} detected. Layer version increased to ${latestVersion}`);
    context.print.warning('Note: You need to run "amplify update function" to configure your functions with the latest layer version.');
    await setNewVersionPermissions(context, layerName, layerState);
  }
  await layerState.setNewVersionHash(); // "finialize" the latest layer version
  const storedParams = layerState.toStoredLayerParameters();
  const additionalLayerParams: {
    layerName: string;
    build: boolean;
    providerContext: {
      provider: string;
      service: string;
      projectName: string;
    };
    runtimes?: LayerRuntime[];
  } = {
    layerName,
    build: true,
    providerContext: {
      provider,
      service: ServiceName.LambdaLayer,
      projectName: context.amplify.getProjectDetails().projectConfig.projectName,
    },
  };

  if (isMultiEnvLayer(context, layerName)) {
    additionalLayerParams.runtimes = getLayerRuntimes(pathManager.getBackendDirPath(), layerName);
  }

  const layerParameters = { ...storedParams, ...additionalLayerParams } as LayerParameters;
  updateLayerArtifacts(context, layerParameters, latestVersion, { cfnFile: isNewVersion });
}

async function setNewVersionPermissions(context: any, layerName: string, layerState: LayerMetadata) {
  const defaultPermissions: PrivateLayer[] = [{ type: Permission.private }];
  let usePrevPermissions = true;
  const latestVersion = layerState.getLatestVersion();
  const latestVersionState = layerState.getVersion(latestVersion);
  const hasNonDefaultPerms =
    latestVersionState.isPublic() || latestVersionState.listAccountAccess().length > 0 || latestVersionState.listOrgAccess().length > 0;
  const yesFlagSet = _.get(context, ['parameters', 'options', 'yes'], false);
  if (yesFlagSet) {
    context.print.warning(`Permissions from previous layer version carried forward to new version by default`);
  } else if (hasNonDefaultPerms) {
    usePrevPermissions = (await prompt(previousPermissionsQuestion(layerName))).usePreviousPermissions;
  }
  if (!usePrevPermissions) {
    layerState.setPermissionsForVersion(latestVersion, defaultPermissions);
  }
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
  const nodePath = path.join(layerPath, 'lib', 'nodejs');
  const nodeHashOptions = {
    files: {
      include: ['package.json'],
    },
  };
  const pyPath = path.join(layerPath, 'lib', 'python');
  const optPath = path.join(layerPath, 'opt');

  const joinedHashes = (await Promise.all([safeHash(nodePath, nodeHashOptions), safeHash(pyPath), safeHash(optPath)])).join();

  return crypto
    .createHash('sha256')
    .update(joinedHashes)
    .digest('base64');
};

// wrapper around hashElement that will return an empty string if the path does not exist
const safeHash = async (path: string, opts?: any): Promise<string> => {
  if (fs.pathExistsSync(path)) {
    return (
      await hashElement(path, opts).catch(() => {
        throw new Error(`An error occurred hashing directory ${path}`);
      })
    ).hash;
  }
  return '';
};

function validFilesize(path, maxSize = 250) {
  try {
    const { size } = fs.statSync(path);
    const fileSize = Math.round(size / 1024 ** 2);
    return fileSize < maxSize;
  } catch (error) {
    return new Error(`Calculating file size failed: ${path}`);
  }
}

interface Resource {
  service: ServiceName;
  dependsOn?: FunctionDependency[];
  resourceName: string;
  category: string;
}
