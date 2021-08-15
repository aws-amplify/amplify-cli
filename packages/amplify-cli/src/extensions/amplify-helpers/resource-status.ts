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

function filterResources(resources, filteredResources) {
  if (!filteredResources) {
    return resources;
  }

  resources = resources.filter(resource => {
    let common = false;
    for (let i = 0; i < filteredResources.length; ++i) {
      if (filteredResources[i].category === resource.category && filteredResources[i].resourceName === resource.resourceName) {
        common = true;
        break;
      }
    }
    return common;
  });

  return resources;
}

function getAllResources(amplifyMeta, category, resourceName, filteredResources) {
  let resources: any[] = [];

  Object.keys(amplifyMeta).forEach(categoryName => {
    const categoryItem = amplifyMeta[categoryName];
    Object.keys(categoryItem).forEach(resource => {
      amplifyMeta[categoryName][resource].resourceName = resource;
      amplifyMeta[categoryName][resource].category = categoryName;
      resources.push(amplifyMeta[categoryName][resource]);
    });
  });

  resources = filterResources(resources, filteredResources);

  if (category !== undefined && resourceName !== undefined) {
    // Create only specified resource in the cloud
    resources = resources.filter(resource => resource.category === category && resource.resourceName === resourceName);
  }

  if (category !== undefined && !resourceName) {
    // Create all the resources for the specified category in the cloud
    resources = resources.filter(resource => resource.category === category);
  }

  return resources;
}

function getResourcesToBeCreated(amplifyMeta, currentAmplifyMeta, category, resourceName, filteredResources) {
  let resources: any[] = [];
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

  if (category !== undefined && !resourceName) {
    // Deletes all the resources for the specified category in the cloud
    resources = resources.filter(resource => resource.category === category);
  }

  return resources;
}

async function getResourcesToBeUpdated(amplifyMeta, currentAmplifyMeta, category, resourceName, filteredResources) {
  let resources: any[] = [];

  await asyncForEach(Object.keys(amplifyMeta), async categoryName => {
    const categoryItem = amplifyMeta[categoryName];
    await asyncForEach(Object.keys(categoryItem), async resource => {
      if (categoryName === 'analytics') {
        removeGetUserEndpoints(resource);
      }

      if (
        currentAmplifyMeta[categoryName] &&
        currentAmplifyMeta[categoryName][resource] !== undefined &&
        amplifyMeta[categoryName] &&
        amplifyMeta[categoryName][resource] !== undefined &&
        amplifyMeta[categoryName][resource].serviceType !== 'imported'
      ) {
        if (categoryName === 'function' && currentAmplifyMeta[categoryName][resource].service === FunctionServiceName.LambdaLayer) {
          const backendModified = await isBackendDirModifiedSinceLastPush(
            resource,
            categoryName,
            currentAmplifyMeta[categoryName][resource].lastPushTimeStamp,
            hashLayerResource,
          );

          if (backendModified) {
            amplifyMeta[categoryName][resource].resourceName = resource;
            amplifyMeta[categoryName][resource].category = categoryName;
            resources.push(amplifyMeta[categoryName][resource]);
          }
        } else {
          const backendModified = await isBackendDirModifiedSinceLastPush(
            resource,
            categoryName,
            currentAmplifyMeta[categoryName][resource].lastPushTimeStamp,
            getHashForResourceDir,
          );

          if (backendModified) {
            amplifyMeta[categoryName][resource].resourceName = resource;
            amplifyMeta[categoryName][resource].category = categoryName;
            resources.push(amplifyMeta[categoryName][resource]);
          }

          if (categoryName === 'hosting' && currentAmplifyMeta[categoryName][resource].service === 'ElasticContainer') {
            const {
              frontend,
              [frontend]: {
                config: { SourceDir },
              },
            } = stateManager.getProjectConfig();
            // build absolute path for Dockerfile and docker-compose.yaml
            const projectRootPath = pathManager.findProjectRoot();
            if (projectRootPath) {
              const sourceAbsolutePath = path.join(projectRootPath, SourceDir);

              // Generate the hash for this file, cfn files are autogenerated based on Dockerfile and resource settings
              // Hash is generated by this files and not cfn files
              const dockerfileHash = await getHashForResourceDir(sourceAbsolutePath, [
                'Dockerfile',
                'docker-compose.yaml',
                'docker-compose.yml',
              ]);

              // Compare hash with value stored on meta
              if (currentAmplifyMeta[categoryName][resource].lastPushDirHash !== dockerfileHash) {
                resources.push(amplifyMeta[categoryName][resource]);
                return;
              }
            }
          }
        }
      }
    });
  });

  resources = filterResources(resources, filteredResources);

  if (category !== undefined && resourceName !== undefined) {
    resources = resources.filter(resource => resource.category === category && resource.resourceName === resourceName);
  }

  if (category !== undefined && !resourceName) {
    resources = resources.filter(resource => resource.category === category);
  }

  return resources;
}

function getResourcesToBeSynced(amplifyMeta, currentAmplifyMeta, category, resourceName, filteredResources) {
  let resources: any[] = [];

  // For imported resource we are handling add/remove/delete in one place, because
  // it does not involve CFN operations we still need a way to enforce the CLI
  // to show changes status when imported resources are added or removed

  Object.keys(amplifyMeta).forEach(categoryName => {
    const categoryItem = amplifyMeta[categoryName];

    Object.keys(categoryItem)
      .filter(resource => categoryItem[resource].serviceType === 'imported')
      .forEach(resource => {
        // Added
        if (
          _.get(currentAmplifyMeta, [categoryName, resource], undefined) === undefined &&
          _.get(amplifyMeta, [categoryName, resource], undefined) !== undefined
        ) {
          amplifyMeta[categoryName][resource].resourceName = resource;
          amplifyMeta[categoryName][resource].category = categoryName;
          amplifyMeta[categoryName][resource].sync = 'import';

          resources.push(amplifyMeta[categoryName][resource]);
        } else if (
          _.get(currentAmplifyMeta, [categoryName, resource], undefined) !== undefined &&
          _.get(amplifyMeta, [categoryName, resource], undefined) === undefined
        ) {
          // Removed
          amplifyMeta[categoryName][resource].resourceName = resource;
          amplifyMeta[categoryName][resource].category = categoryName;
          amplifyMeta[categoryName][resource].sync = 'unlink';

          resources.push(amplifyMeta[categoryName][resource]);
        } else if (
          _.get(currentAmplifyMeta, [categoryName, resource], undefined) !== undefined &&
          _.get(amplifyMeta, [categoryName, resource], undefined) !== undefined
        ) {
          // Refresh - for resources that are already present, it is possible that secrets needed to be
          // regenerated or any other data needs to be refreshed, it is a special state for imported resources
          // and only need to be handled in env add, but no different status is being printed in status
          amplifyMeta[categoryName][resource].resourceName = resource;
          amplifyMeta[categoryName][resource].category = categoryName;
          amplifyMeta[categoryName][resource].sync = 'refresh';

          resources.push(amplifyMeta[categoryName][resource]);
        }
      });
  });

  // For remove it is possible that the the object key for the category not present in the meta so an extra iteration needed on
  // currentAmplifyMeta keys as well

  Object.keys(currentAmplifyMeta).forEach(categoryName => {
    const categoryItem = currentAmplifyMeta[categoryName];

    Object.keys(categoryItem)
      .filter(resource => categoryItem[resource].serviceType === 'imported')
      .forEach(resource => {
        // Removed
        if (
          _.get(currentAmplifyMeta, [categoryName, resource], undefined) !== undefined &&
          _.get(amplifyMeta, [categoryName, resource], undefined) === undefined
        ) {
          currentAmplifyMeta[categoryName][resource].resourceName = resource;
          currentAmplifyMeta[categoryName][resource].category = categoryName;
          currentAmplifyMeta[categoryName][resource].sync = 'unlink';

          resources.push(currentAmplifyMeta[categoryName][resource]);
        }
      });
  });

  resources = filterResources(resources, filteredResources);

  if (category !== undefined && resourceName !== undefined) {
    resources = resources.filter(resource => resource.category === category && resource.resourceName === resourceName);
  }

  if (category !== undefined && !resourceName) {
    resources = resources.filter(resource => resource.category === category);
  }

  return resources;
}

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; ++index) {
    await callback(array[index], index, array);
  }
}

export async function getResourceStatus(category?, resourceName?, providerName?, filteredResources?) {
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
      return resourceChanged;
}

export async function showResourceTable(category?, resourceName?, filteredResources?) {
  const amplifyProjectInitStatus = getCloudInitStatus();

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
