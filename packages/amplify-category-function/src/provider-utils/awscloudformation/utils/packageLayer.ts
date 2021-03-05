import { pathManager } from 'amplify-cli-core';
import * as path from 'path';
import * as fs from 'fs-extra';
import { Packager } from '../types/packaging-types';
import { LayerConfiguration, loadLayerConfigurationFile } from './layerConfiguration';
import { FunctionRuntimeLifecycleManager } from 'amplify-function-plugin-interface';
import { ServiceName } from './constants';
import _ from 'lodash';
import { hashElement } from 'folder-hash';
import { $TSContext, pathManager } from 'amplify-cli-core';
import { ServiceName, provider } from './constants';
import { previousPermissionsQuestion } from './layerHelpers';
import { getLayerMetadataFactory, Permission, PrivateLayer, LayerParameters, LayerMetadata, LayerRuntime } from './layerParams';
import crypto from 'crypto';
import { updateLayerArtifacts } from './storeResources';
import globby from 'globby';
import { Packager, PackageRequestMeta } from '../types/packaging-types';

/**
 * Packages lambda  layer  code and artifacts into a lambda-compatible .zip file
 */
export const packageLayer: Packager = async (context, resource) => {
  const resourcePath = path.join(pathManager.getBackendDirPath(), resource.category, resource.resourceName);

  // call runtime module packaging
  const layerConfig: LayerConfiguration = loadLayerConfigurationFile(pathManager.getBackendDirPath(), resource.resourceName);
  const layerCodePath = path.join(resourcePath, 'lib', layerConfig.runtimes[0].layerExecutablePath);
  const distDir = path.join(resourcePath, 'dist');
  fs.ensureDirSync(distDir);

  const runtimePlugin: FunctionRuntimeLifecycleManager = (await context.amplify.loadRuntimePlugin(
    context,
    layerConfig.runtimes[0].runtimePluginId,
  )) as FunctionRuntimeLifecycleManager;

  const previousHash = loadPreviousLayerHash(resource.resourceName);
  const currentHash = await ensureLayerVersion(context, resource.resourceName, previousHash);
  // prepare package request
  const destination = path.join(distDir, 'latest-build.zip');
  const packageRequest = {
    env: context.amplify.getEnvInfo().envName,
    srcRoot: layerCodePath,
    dstFilename: destination,
    runtime: layerConfig.runtimes[0].value,
    lastPackageTimeStamp: resource.lastPackageTimeStamp ? new Date(resource.lastPackageTimeStamp) : undefined,
    lastBuildTimeStamp: resource.lastBuildTimeStamp ? new Date(resource.lastBuildTimeStamp) : undefined,
    skipHashing: resource.skipHashing,
    service: ServiceName.LambdaLayer,
    currentHash: previousHash !== currentHash,
  };

  // if (isMultiEnvLayer(layerName)) {
  //   additionalLayerParams.runtimes = getLayerRuntimes(pathManager.getBackendDirPath(), layerName);
  // }

  const layerParameters = { ...storedParams, ...additionalLayerParams } as LayerParameters;
  await updateLayerArtifacts(context, layerParameters, { cfnFile: isNewVersion });
}

async function setNewVersionPermissions(context: $TSContext, layerName: string, layerState: LayerMetadata) {
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
    usePrevPermissions = (await prompt(previousPermissionsQuestion())).usePreviousPermissions;
  }
  return { zipFilename, zipFilePath: destination };
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

  return crypto.createHash('sha256').update(joinedHashes).digest('base64');
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

function validFilesize(path: string, maxSize = 250) {
  try {
    const { size } = fs.statSync(path);
    const fileSize = Math.round(size / 1024 ** 2);
    return fileSize < maxSize;
  } catch (error) {
    return new Error(`Calculating file size failed: ${path}`);
  }
}
