import * as fs from 'fs-extra';
import * as path from 'path';
import chalk from 'chalk';
import _ from 'lodash';
import { print } from './print';
import { hashElement, HashElementOptions } from 'folder-hash';
import { getEnvInfo } from './get-env-info';
import { CLOUD_INITIALIZED, CLOUD_NOT_INITIALIZED, getCloudInitStatus } from './get-cloud-init-status';
import { ServiceName as FunctionServiceName, hashLayerResource } from 'amplify-category-function';
import { removeGetUserEndpoints } from '../amplify-helpers/remove-pinpoint-policy';
import { pathManager, stateManager, $TSMeta, $TSAny, NotInitializedError } from 'amplify-cli-core';
import { rootStackFileName } from 'amplify-provider-awscloudformation';

async function isBackendDirModifiedSinceLastPush(resourceName, category, lastPushTimeStamp, hashFunction) {
  // Pushing the resource for the first time hence no lastPushTimeStamp
  if (!lastPushTimeStamp) {
    return false;
  }

  const localBackendDir = path.normalize(path.join(pathManager.getBackendDirPath(), category, resourceName));
  const cloudBackendDir = path.normalize(path.join(pathManager.getCurrentCloudBackendDirPath(), category, resourceName));

  if (!fs.existsSync(localBackendDir)) {
    return false;
  }

  const localDirHash = await hashFunction(localBackendDir, resourceName);
  const cloudDirHash = await hashFunction(cloudBackendDir, resourceName);

  return localDirHash !== cloudDirHash;
}

export function getHashForRootStack(dirPath, files?: string[]) {
  const options: HashElementOptions = {
    folders: { exclude: ['.*', 'node_modules', 'test_coverage', 'dist', 'build'] },
    files: {
      include: files,
    },
  };

  return hashElement(dirPath, options).then(result => result.hash);
}

export function getHashForResourceDir(dirPath, files?: string[]) {
  const options: HashElementOptions = {
    folders: { exclude: ['.*', 'node_modules', 'test_coverage', 'dist', 'build'] },
    files: {
      include: files,
    },
  };

  return hashElement(dirPath, options).then(result => result.hash);
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}


import { print } from './print';
import { CLOUD_INITIALIZED,  getCloudInitStatus } from './get-cloud-init-status';
import { ViewResourceTableParams } from "amplify-cli-core";
import { viewSummaryTable, viewEnvInfo, viewResourceDiffs } from './resource-status-view';
import { getMultiCategoryStatus, getResourceStatus, getHashForResourceDir } from './resource-status-data';
import { getEnvInfo } from './get-env-info';
import chalk from 'chalk';

export { getResourceStatus, getHashForResourceDir }

export async function showStatusTable( tableViewFilter : ViewResourceTableParams ){
      const amplifyProjectInitStatus = getCloudInitStatus();
      const {
        resourcesToBeCreated,
        resourcesToBeUpdated,
        resourcesToBeDeleted,
        resourcesToBeSynced,
        allResources,
        tagsUpdated,
      } = await getMultiCategoryStatus(tableViewFilter);

      //1. Display Environment Info
      if (amplifyProjectInitStatus === CLOUD_INITIALIZED) {
        viewEnvInfo();
      }
      //2. Display Summary Table
      viewSummaryTable({  resourcesToBeUpdated,
                          resourcesToBeCreated,
                          resourcesToBeDeleted,
                          resourcesToBeSynced,
                          allResources
                      });
      //3. Display Tags Status
      if (tagsUpdated) {
        print.info('\nTag Changes Detected');
      }

      //4. Display Detailed Diffs (Cfn/NonCfn)
      if ( tableViewFilter.verbose ) {
          await viewResourceDiffs( {  resourcesToBeUpdated,
                                      resourcesToBeDeleted,
                                      resourcesToBeCreated } );
      }

      const resourceChanged = resourcesToBeCreated.length +
                              resourcesToBeUpdated.length +
                              resourcesToBeSynced.length +
                              resourcesToBeDeleted.length > 0 || tagsUpdated;

      return resourceChanged;
}

export async function showResourceTable(category?, resourceName?, filteredResources?) {
  const amplifyProjectInitStatus = getCloudInitStatus();
  let amplifyMeta: $TSAny;
  let currentAmplifyMeta: $TSMeta = {};

  if (amplifyProjectInitStatus === CLOUD_INITIALIZED) {
    amplifyMeta = stateManager.getMeta();
    currentAmplifyMeta = stateManager.getCurrentMeta();
  } else if (amplifyProjectInitStatus === CLOUD_NOT_INITIALIZED) {
    amplifyMeta = stateManager.getBackendConfig();
  } else {
    throw new NotInitializedError();
  }

  let resourcesToBeCreated: any = getResourcesToBeCreated(amplifyMeta, currentAmplifyMeta, category, resourceName, filteredResources);
  let resourcesToBeUpdated: any = await getResourcesToBeUpdated(amplifyMeta, currentAmplifyMeta, category, resourceName, filteredResources);
  let resourcesToBeSynced: any = getResourcesToBeSynced(amplifyMeta, currentAmplifyMeta, category, resourceName, filteredResources);
  let resourcesToBeDeleted: any = getResourcesToBeDeleted(amplifyMeta, currentAmplifyMeta, category, resourceName, filteredResources);

  let allResources: any = getAllResources(amplifyMeta, category, resourceName, filteredResources);

  resourcesToBeCreated = resourcesToBeCreated.filter(resource => resource.category !== 'provider');

  if (providerName) {
    resourcesToBeCreated = resourcesToBeCreated.filter(resource => resource.providerPlugin === providerName);
    resourcesToBeUpdated = resourcesToBeUpdated.filter(resource => resource.providerPlugin === providerName);
    resourcesToBeSynced = resourcesToBeSynced.filter(resource => resource.providerPlugin === providerName);
    resourcesToBeDeleted = resourcesToBeDeleted.filter(resource => resource.providerPlugin === providerName);
    allResources = allResources.filter(resource => resource.providerPlugin === providerName);
  }
  // if not equal there is a tag update
  const tagsUpdated = !_.isEqual(stateManager.getProjectTags(), stateManager.getCurrentProjectTags());

  // check if there is an update in root stack

  const rootStackUpdated: boolean = await isRootStackModifiedSinceLastPush(getHashForRootStack);

  return {
    resourcesToBeCreated,
    resourcesToBeUpdated,
    resourcesToBeSynced,
    resourcesToBeDeleted,
    tagsUpdated,
    allResources,
    rootStackUpdated,
  };
}

export async function showResourceTable(category, resourceName, filteredResources) {
  const amplifyProjectInitStatus = getCloudInitStatus();

  if (amplifyProjectInitStatus === CLOUD_INITIALIZED) {
    const { envName } = getEnvInfo();

    print.info('');
    print.info(`${chalk.green('Current Environment')}: ${envName}`);
    print.info('');
  }

  //Prepare state for view
  const {
    resourcesToBeCreated,
    resourcesToBeUpdated,
    resourcesToBeDeleted,
    resourcesToBeSynced,
    allResources,
    tagsUpdated,
    rootStackUpdated,
  } = await getResourceStatus(category, resourceName, undefined, filteredResources);

  //1. Display Environment Info
  if (amplifyProjectInitStatus === CLOUD_INITIALIZED) {
    viewEnvInfo();
  }
  //2. Display Summary Table
  viewSummaryTable({  resourcesToBeUpdated,
                      resourcesToBeCreated,
                      resourcesToBeDeleted,
                      resourcesToBeSynced,
                      allResources
                  });
  //3. Display Tags Status
  if (tagsUpdated) {
    print.info('\nTag Changes Detected');
  }

  if (rootStackUpdated) {
    print.info('\n RootStack Changes Detected');
  }

  const resourceChanged =
    resourcesToBeCreated.length + resourcesToBeUpdated.length + resourcesToBeSynced.length + resourcesToBeDeleted.length > 0 ||
    tagsUpdated ||
    rootStackUpdated;

  return resourceChanged;
}

async function isRootStackModifiedSinceLastPush(hashFunction): Promise<boolean> {
  try {
    const projectPath = pathManager.findProjectRoot();
    const localBackendDir = pathManager.getRootStackDirPath(projectPath!);
    const cloudBackendDir = pathManager.getCurrentCloudRootStackDirPath(projectPath!);

    const localDirHash = await hashFunction(localBackendDir, [rootStackFileName]);
    const cloudDirHash = await hashFunction(cloudBackendDir, [rootStackFileName]);

    return localDirHash !== cloudDirHash;
  } catch (error) {
    throw new Error('Amplify Project not initialized.');
  }
}
