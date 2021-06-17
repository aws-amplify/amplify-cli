import { pathManager } from 'amplify-cli-core';
import * as path from 'path';
import * as fs from 'fs-extra';
import { Packager } from '../types/packaging-types';
import { getRuntimeManager } from './functionPluginLoader';
import { zipPackage } from './zipResource';

/**
 * Packages lambda source code and artifacts into a lambda-compatible .zip file
 */
export const packageFunction: Packager = async (context, resource) => {
  const resourcePath = path.join(pathManager.getBackendDirPath(), resource.category, resource.resourceName);
  const runtimeManager = await getRuntimeManager(context, resource.resourceName);
  const distDir = path.join(resourcePath, 'dist');
  fs.ensureDirSync(distDir);
  const destination = path.join(distDir, 'latest-build.zip');
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
  const zipFilename = packageHash
    ? `${resource.resourceName}-${packageHash}-build.zip`
    : resource.distZipFilename ?? `${resource.category}-${resource.resourceName}-build.zip`;
  context.amplify.updateAmplifyMetaAfterPackage(resource, zipFilename);
  return { newPackageCreated: true, zipFilename, zipFilePath: destination };
};
