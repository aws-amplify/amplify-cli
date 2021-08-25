import { $TSAny, $TSContext, convertNumBytes, getFolderSize, pathManager, stateManager } from 'amplify-cli-core';
import { FunctionRuntimeLifecycleManager, ZipEntry } from 'amplify-function-plugin-interface';
import chalk from 'chalk';
import * as fs from 'fs-extra';
import _ from 'lodash';
import { EOL } from 'os';
import * as path from 'path';
import { lambdaLayerNewVersionWalkthrough } from '../service-walkthroughs/lambdaLayerWalkthrough';
import { Packager } from '../types/packaging-types';
import { accessPermissions, cfnTemplateSuffix, description, lambdaPackageLimitInMB, ServiceName, versionHash } from './constants';
import { LayerCloudState } from './layerCloudState';
import { loadLayerConfigurationFile } from './layerConfiguration';
import { ensureLayerVersion, getChangedResources, loadPreviousLayerHash, loadStoredLayerParameters } from './layerHelpers';
import { defaultLayerPermission } from './layerParams';
import { getLayerTemplate, updateLayerArtifacts } from './storeResources';
import { zipPackage } from './zipResource';

/**
 * Packages lambda layer code and artifacts into a lambda-compatible .zip file
 */
export const packageLayer: Packager = async (context, resource, isExport) => {
  const previousHash = loadPreviousLayerHash(resource.resourceName);
  const currentHash = await ensureLayerVersion(context, resource.resourceName, previousHash);

  if (!isExport && previousHash === currentHash) {
    // This happens when a Lambda layer's permissions have been updated, but no new layer version needs to be pushed
    return { newPackageCreated: false, zipFilename: undefined, zipFilePath: undefined };
  }

  const resourcePath = pathManager.getResourceDirectoryPath(undefined, resource.category, resource.resourceName);

  const { runtimes } = loadLayerConfigurationFile(resource.resourceName);
  const distDir = path.join(resourcePath, 'dist');
  fs.ensureDirSync(distDir);
  const destination = path.join(distDir, 'latest-build.zip');

  // check total layer size is less than 250MB
  let layerSizeInBytes = 0;
  // Add up all the lib/opt folders
  layerSizeInBytes += await getFolderSize([path.join(resourcePath, 'lib'), path.join(resourcePath, 'opt')]);

  if (layerSizeInBytes > lambdaPackageLimitInMB * 1024 ** 2) {
    throw new Error(
      `Lambda layer ${resource.resourceName} is too large: ${convertNumBytes(layerSizeInBytes).toMB()}/${lambdaPackageLimitInMB} MB`,
    );
  }

  let zipEntries: ZipEntry[] = [{ sourceFolder: path.join(resourcePath, 'opt') }];

  for (const runtime of runtimes) {
    const layerCodePath = path.join(resourcePath, 'lib', runtime.layerExecutablePath);

    // call runtime module packaging
    const runtimePlugin: FunctionRuntimeLifecycleManager = (await context.amplify.loadRuntimePlugin(
      context,
      runtime.runtimePluginId,
    )) as FunctionRuntimeLifecycleManager;

    // prepare package request
    const packageRequest = {
      env: context.amplify.getEnvInfo().envName,
      srcRoot: layerCodePath,
      dstFilename: destination,
      runtime: runtime.value,
      lastPackageTimeStamp: resource.lastPackageTimeStamp ? new Date(resource.lastPackageTimeStamp) : undefined,
      lastBuildTimeStamp: resource.lastBuildTimeStamp ? new Date(resource.lastBuildTimeStamp) : undefined,
      skipHashing: resource.skipHashing,
      service: ServiceName.LambdaLayer,
      currentHash: previousHash !== currentHash,
    };
    const packageResult = await runtimePlugin.package(packageRequest);

    if (packageResult.packageHash && packageResult?.zipEntries?.length > 0) {
      zipEntries = [...zipEntries, ...packageResult.zipEntries];
    }
  }

  await zipPackage(zipEntries, destination);

  const layerCloudState = LayerCloudState.getInstance(resource.resourceName);
  if (!layerCloudState.latestVersionLogicalId) {
    // "Should" never be reachable, but sanity check just in case
    throw new Error(`LogicalId missing for new layer version: ${resource.resourceName}.`);
  }

  const zipFilename = createLayerZipFilename(resource.resourceName, layerCloudState.latestVersionLogicalId);
  if (!isExport) {
    // don't  apply an update to Amplify meta on export
    context.amplify.updateAmplifyMetaAfterPackage(resource, zipFilename, { resourceKey: versionHash, hashValue: currentHash });
  }
  return { newPackageCreated: true, zipFilename, zipFilePath: destination };
};

export async function checkContentChanges(context: $TSContext, layerResources: Array<$TSAny>): Promise<void> {
  const changedLayerResources = await getChangedResources(layerResources);

  const prePushNotificationTemplate = (resourceName: string, description: string, timestampString: string, accessPermissions?: string) => {
    const descriptionLine = `  - ${description}: ${chalk.green('Updated layer version ')} ${chalk.gray(timestampString)}`;
    const permissionLine = `  - ${accessPermissions}: ${chalk.green('Maintain existing permissions')}`;
    return `${resourceName}\n${accessPermissions ? `${permissionLine}\n${descriptionLine}` : descriptionLine}`;
  };

  if (changedLayerResources.length > 0) {
    context.print.info('');
    if (layerResources.filter(layer => loadPreviousLayerHash(layer.resourceName) !== undefined).length > 0) {
      context.print.info('Content changes in Lambda layers detected.');
    }
    context.print.info('Suggested configuration for new layer versions:');
    context.print.info('');

    const timestampString = new Date().toISOString();
    const prepushNotificationMessage = changedLayerResources.map(layer => {
      const { resourceName } = layer;
      const parameters = loadStoredLayerParameters(context, resourceName);
      layer.parameters = parameters;
      if (!_.isEqual(parameters.permissions, [defaultLayerPermission])) {
        return prePushNotificationTemplate(resourceName, description, timestampString, accessPermissions);
      }
      return prePushNotificationTemplate(resourceName, description, timestampString);
    });

    context.print.info(prepushNotificationMessage.join(EOL));
    context.print.info('');

    const accepted =
      context.input.options?.yes || (await context.prompt.confirm('Accept the suggested layer version configurations?', true));
    for (const layer of changedLayerResources) {
      let { parameters } = layer;
      if (!accepted) {
        context.print.info('');
        context.print.info(`Change options layer: ${layer.resourceName}`);
        context.print.info('');
        parameters = await lambdaLayerNewVersionWalkthrough(parameters, timestampString);
      } else {
        parameters.description = `Updated layer version ${timestampString}`;
      }

      // No need to update cfn or meta files since it will be updated during the packageLayer step
      await updateLayerArtifacts(context, parameters, {
        updateMeta: false,
        generateCfnFile: false,
        updateDescription: true,
        updateLayerParams: true,
      });
    }
  }
}

export function createLayerZipFilename(resourceName: string, latestLayerVersionLogicalId: string) {
  return `${resourceName}-${latestLayerVersionLogicalId}-build.zip`;
}
