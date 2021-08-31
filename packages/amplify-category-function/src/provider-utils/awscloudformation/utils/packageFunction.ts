import { convertNumBytes, getFolderSize, pathManager } from 'amplify-cli-core';
import { LambdaLayer } from 'amplify-function-plugin-interface';
import * as fs from 'fs-extra';
import * as path from 'path';
import { lambdaPackageLimitInMB } from './constants';
import { categoryName } from '../../../constants';
import { Packager } from '../types/packaging-types';
import { getRuntimeManager } from './functionPluginLoader';
import { loadFunctionParameters } from './loadFunctionParameters';
import { zipPackage } from './zipResource';

/**
 * Packages lambda source code and artifacts into a lambda-compatible .zip file
 */
export const packageFunction: Packager = async (context, resource) => {
  const resourcePath = pathManager.getResourceDirectoryPath(undefined, resource.category, resource.resourceName);
  const runtimeManager = await getRuntimeManager(context, resource.resourceName);
  const distDirPath = path.join(resourcePath, 'dist');
  fs.ensureDirSync(distDirPath);
  const destination = path.join(distDirPath, 'latest-build.zip');
  const packageRequest = {
    env: context.amplify.getEnvInfo().envName,
    srcRoot: resourcePath,
    dstFilename: destination,
    runtime: runtimeManager.runtime,
    lastPackageTimeStamp: resource.lastPackageTimeStamp ? new Date(resource.lastPackageTimeStamp) : undefined,
    lastBuildTimeStamp: resource.lastBuildTimeStamp ? new Date(resource.lastBuildTimeStamp) : undefined,
    skipHashing: resource.skipHashing,
  };
  const packageResult = await runtimeManager.package(packageRequest);
  const packageHash = packageResult.packageHash;
  if (packageHash) {
    await zipPackage(packageResult.zipEntries, destination);
  }

  const functionSizeInBytes = await getFolderSize(path.join(resourcePath, 'src'));
  let layersSizeInBytes = 0;

  const functionParameters: { lambdaLayers?: LambdaLayer[] } = loadFunctionParameters(resourcePath);

  for (const layer of functionParameters?.lambdaLayers || []) {
    // Add up all the project lib/opt folders
    if (layer.type === 'ProjectLayer') {
      const layerDirPath = pathManager.getResourceDirectoryPath(undefined, categoryName, layer.resourceName);
      layersSizeInBytes += await getFolderSize([path.join(layerDirPath, 'lib'), path.join(layerDirPath, 'opt')]);
    }
  }

  if (functionSizeInBytes + layersSizeInBytes > lambdaPackageLimitInMB * 1024 ** 2) {
    throw new Error(
      `Total size of Lambda function ${
        resource.resourceName
      } plus it's dependent layers exceeds ${lambdaPackageLimitInMB}MB limit. Lambda function is ${convertNumBytes(
        functionSizeInBytes,
      ).toMB()}MB. Dependent Lambda layers are ${convertNumBytes(layersSizeInBytes).toMB()}MB.`,
    );
  }

  const zipFilename = packageHash
    ? `${resource.resourceName}-${packageHash}-build.zip`
    : resource.distZipFilename ?? `${resource.category}-${resource.resourceName}-build.zip`;
  context.amplify.updateAmplifyMetaAfterPackage(resource, zipFilename);
  return { newPackageCreated: true, zipFilename, zipFilePath: destination };
};
