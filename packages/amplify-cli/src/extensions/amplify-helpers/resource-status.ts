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

  Object.keys(amplifyMeta).forEach(categoryName => {
    const categoryItem = amplifyMeta[categoryName];
    Object.keys(categoryItem).forEach(resource => {
      if (
        (!amplifyMeta[categoryName][resource].lastPushTimeStamp ||
          !currentAmplifyMeta[categoryName] ||
          !currentAmplifyMeta[categoryName][resource]) &&
        categoryName !== 'providers' &&
        amplifyMeta[categoryName][resource].serviceType !== 'imported'
      ) {
        amplifyMeta[categoryName][resource].resourceName = resource;
        amplifyMeta[categoryName][resource].category = categoryName;
        resources.push(amplifyMeta[categoryName][resource]);
      }
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

  // Check for dependencies and add them

  for (let i = 0; i < resources.length; ++i) {
    if (resources[i].dependsOn && resources[i].dependsOn.length > 0) {
      for (let j = 0; j < resources[i].dependsOn.length; ++j) {
        const dependsOnCategory = resources[i].dependsOn[j].category;
        const dependsOnResourcename = resources[i].dependsOn[j].resourceName;
        if (
          amplifyMeta[dependsOnCategory] &&
          (!amplifyMeta[dependsOnCategory][dependsOnResourcename].lastPushTimeStamp ||
            !currentAmplifyMeta[dependsOnCategory] ||
            !currentAmplifyMeta[dependsOnCategory][dependsOnResourcename]) &&
          amplifyMeta[dependsOnCategory][dependsOnResourcename].serviceType !== 'imported'
        ) {
          resources.push(amplifyMeta[dependsOnCategory][dependsOnResourcename]);
        }
      }
    }
  }

  return _.uniqWith(resources, _.isEqual);
}

function getResourcesToBeDeleted(amplifyMeta, currentAmplifyMeta, category, resourceName, filteredResources) {
  let resources: any[] = [];

  Object.keys(currentAmplifyMeta).forEach(categoryName => {
    const categoryItem = currentAmplifyMeta[categoryName];
    Object.keys(categoryItem).forEach(resource => {
      if ((!amplifyMeta[categoryName] || !amplifyMeta[categoryName][resource]) && categoryItem[resource].serviceType !== 'imported') {
        currentAmplifyMeta[categoryName][resource].resourceName = resource;
        currentAmplifyMeta[categoryName][resource].category = categoryName;

        resources.push(currentAmplifyMeta[categoryName][resource]);
      }
    });
  });

  resources = filterResources(resources, filteredResources);

  if (category !== undefined && resourceName !== undefined) {
    // Deletes only specified resource in the cloud
    resources = resources.filter(resource => resource.category === category && resource.resourceName === resourceName);
  }

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

  return {
    resourcesToBeCreated,
    resourcesToBeUpdated,
    resourcesToBeSynced,
    resourcesToBeDeleted,
    tagsUpdated,
    allResources,
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

  const {
    resourcesToBeCreated,
    resourcesToBeUpdated,
    resourcesToBeDeleted,
    resourcesToBeSynced,
    allResources,
    tagsUpdated,
  } = await getResourceStatus(category, resourceName, undefined, filteredResources);

  let noChangeResources = _.differenceWith(
    allResources,
    resourcesToBeCreated.concat(resourcesToBeUpdated).concat(resourcesToBeSynced),
    _.isEqual,
  );
  noChangeResources = noChangeResources.filter(resource => resource.category !== 'providers');

  const createOperationLabel = 'Create';
  const updateOperationLabel = 'Update';
  const deleteOperationLabel = 'Delete';
  const importOperationLabel = 'Import';
  const unlinkOperationLabel = 'Unlink';
  const noOperationLabel = 'No Change';
  const tableOptions = [['Category', 'Resource name', 'Operation', 'Provider plugin']];

  for (let i = 0; i < resourcesToBeCreated.length; ++i) {
    tableOptions.push([
      capitalize(resourcesToBeCreated[i].category),
      resourcesToBeCreated[i].resourceName,
      createOperationLabel,
      resourcesToBeCreated[i].providerPlugin,
    ]);
  }

  for (let i = 0; i < resourcesToBeUpdated.length; ++i) {
    tableOptions.push([
      capitalize(resourcesToBeUpdated[i].category),
      resourcesToBeUpdated[i].resourceName,
      updateOperationLabel,
      resourcesToBeUpdated[i].providerPlugin,
    ]);
  }

  for (let i = 0; i < resourcesToBeSynced.length; ++i) {
    let operation;

    switch (resourcesToBeSynced[i].sync) {
      case 'import':
        operation = importOperationLabel;
        break;
      case 'unlink':
        operation = unlinkOperationLabel;
        break;
      default:
        // including refresh
        operation = noOperationLabel;
        break;
    }

    tableOptions.push([
      capitalize(resourcesToBeSynced[i].category),
      resourcesToBeSynced[i].resourceName,
      operation /*syncOperationLabel*/,
      resourcesToBeSynced[i].providerPlugin,
    ]);
  }

  for (let i = 0; i < resourcesToBeDeleted.length; ++i) {
    tableOptions.push([
      capitalize(resourcesToBeDeleted[i].category),
      resourcesToBeDeleted[i].resourceName,
      deleteOperationLabel,
      resourcesToBeDeleted[i].providerPlugin,
    ]);
  }

  for (let i = 0; i < noChangeResources.length; ++i) {
    tableOptions.push([
      capitalize(noChangeResources[i].category),
      noChangeResources[i].resourceName,
      noOperationLabel,
      noChangeResources[i].providerPlugin,
    ]);
  }

  const { table } = print;

  table(tableOptions, { format: 'markdown' });

  if (tagsUpdated) {
    print.info('\nTag Changes Detected');
  }

  const resourceChanged =
    resourcesToBeCreated.length + resourcesToBeUpdated.length + resourcesToBeSynced.length + resourcesToBeDeleted.length > 0 || tagsUpdated;

  return resourceChanged;
}
