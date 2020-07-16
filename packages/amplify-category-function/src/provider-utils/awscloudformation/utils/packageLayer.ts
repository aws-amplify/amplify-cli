import archiver from 'archiver';
import fs from 'fs-extra';
import glob from 'glob';
import { prompt } from 'inquirer';
import path from 'path';
import _ from 'lodash';
import { hashElement } from 'folder-hash';
import { FunctionDependency } from 'amplify-function-plugin-interface';
import { ServiceName, provider } from './constants';
import { previousPermissionsQuestion } from './layerHelpers';
import { getLayerMetadataFactory, Permission, PrivateLayer, LayerParameters, LayerMetadata } from './layerParams';
import crypto from 'crypto';
import { updateLayerArtifacts } from './storeResources';
import globby from 'globby';

export async function packageLayer(context, resource: Resource) {
  await ensureLayerVersion(context, resource.resourceName);
  return zipLayer(context, resource);
}

async function zipLayer(context, resource: Resource) {
  const layerName = resource.resourceName;
  const resourcePath = path.join(context.amplify.pathManager.getBackendDirPath(), resource.category, layerName);
  const zipFilename = 'latest-build.zip';
  const distDir = path.join(resourcePath, 'dist');
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

    const libPath = path.join(resourcePath, 'lib', '*');
    const optPath = path.join(resourcePath, 'opt');
    zip.pipe(output);
    [...glob.sync(optPath), ...glob.sync(libPath)]
      .filter(folder => fs.lstatSync(folder).isDirectory())
      .forEach(folder => zip.directory(folder, path.basename(folder)));
    zip.finalize();
  });
}

// Check hash results for content changes, bump version if so
async function ensureLayerVersion(context: any, layerName: string) {
  const layerState = getLayerMetadataFactory(context)(layerName);
  const isNewVersion = await layerState.syncVersions();
  if (isNewVersion) {
    const latestVersion = layerState.getLatestVersion();
    context.print.success(`Content changes in Lambda layer ${layerName} detected. Layer version increased to ${latestVersion}`);
    context.print.warning('Note: You need to run "amplify update function" to configure your functions with the latest layer version.');
    await setNewVersionPermissions(context, layerName, layerState);
  }
  await layerState.setNewVersionHash(); // "finialize" the latest layer version
  const storedParams = layerState.toStoredLayerParameters();
  const additionalLayerParams = {
    layerName,
    build: true,
    providerContext: {
      provider,
      service: ServiceName.LambdaLayer,
      projectName: context.amplify.getProjectDetails().projectConfig.projectName,
    },
  };
  const layerParameters: LayerParameters = { ...storedParams, ...additionalLayerParams };
  updateLayerArtifacts(context, layerParameters, { cfnFile: isNewVersion });
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
