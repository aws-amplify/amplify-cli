import { $TSAny, $TSContext, pathManager } from 'amplify-cli-core';
import * as path from 'path';
import * as fs from 'fs-extra';
import { LayerConfiguration, loadLayerConfigurationFile } from './layerConfiguration';
import { FunctionRuntimeLifecycleManager } from 'amplify-function-plugin-interface';
import { ServiceName } from './constants';
import _ from 'lodash';
import { loadPreviousLayerHash, ensureLayerVersion, validFilesize } from './layerHelpers';
import { Packager } from '../types/packaging-types';
import { accessPermissions, description } from './constants';
import { getLayerPath, loadStoredLayerParameters } from './layerHelpers';
import { updateLayerArtifacts } from './storeResources';
import chalk from 'chalk';
import { EOL } from 'os';
import { lambdaLayerNewVersionWalkthrough } from '../service-walkthroughs/lambdaLayerWalkthrough';

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
  if (validFilesize(destination)) {
    context.amplify.updateAmplifyMetaAfterPackage(resource, zipFilename, { resourceKey: 'versionHash', hashValue: currentHash });
  } else {
    throw new Error('File size greater than 250MB');
  }
  return { zipFilename, zipFilePath: destination };
};

export async function checkContentChanges(context: $TSContext, resources: Array<$TSAny>): Promise<void> {
  const changedResources = resources.filter(checkLambdaLayerChanges);
  if (changedResources.length > 0) {
    context.print.info('Content changes in Lambda layers detected.');
    context.print.info('Suggested configuration for new layer versions:');
    context.print.info('');

    const timestampString = new Date().toISOString();
    const prepushNotificationMessage = changedResources.map(resource => {
      const { resourceName } = resource;
      return ` ${resourceName}
      - ${accessPermissions}: ${chalk.green('Maintain existing permissions')}
      - ${description}: ${chalk.green('Updated layer version ') + chalk.gray(timestampString)}`;
    });
    context.print.info(prepushNotificationMessage.join(EOL));
    context.print.info('');

    if (!(await context.prompt.confirm('Accept the suggested layer version configurations?', true))) {
      for (const resource of changedResources) {
        const parameters = await lambdaLayerNewVersionWalkthrough(
          loadStoredLayerParameters(context, resource.resourceName),
          timestampString,
        );
        await updateLayerArtifacts(context, parameters);
      }
    }
  }
}

async function checkLambdaLayerChanges(resource: any): Promise<boolean> {
  const { resourceName } = resource;
  const currentHash = await hashLayerVersionContents(getLayerPath(resourceName));
  const previousHash = loadPreviousLayerHash(resourceName);
  console.log(previousHash);
  return previousHash ? currentHash !== previousHash : false;
}


