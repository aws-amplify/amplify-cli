import { pathManager } from 'amplify-cli-core';
import * as path from 'path';
import * as fs from 'fs-extra';
import { Packager } from '../types/packaging-types';
import { LayerConfiguration, loadLayerConfigurationFile } from './layerConfiguration';
import { FunctionRuntimeLifecycleManager } from 'amplify-function-plugin-interface';
import { ServiceName } from './constants';
import _ from 'lodash';
import { loadPreviousLayerHash, ensureLayerVersion, validFilesize } from './layerHelpers';

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
  const packageResult = await runtimePlugin.package(packageRequest);
  const packageHash = packageResult.packageHash;
  const zipFilename = packageHash
    ? `${resource.resourceName}-${packageHash}-build.zip`
    : resource.distZipFilename ?? `${resource.category}-${resource.resourceName}-build.zip`;
  // check zip size is less than 250MB
  if (validFilesize(context, destination)) {
    context.amplify.updateAmplifyMetaAfterPackage(resource, zipFilename, { resourceKey: 'versionHash', hashValue: currentHash });
  } else {
    throw new Error('File size greater than 250MB');
  }
  return { zipFilename, zipFilePath: destination };
};
