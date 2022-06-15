import { hashLayerResource, ServiceName as FunctionServiceName } from 'amplify-category-function';
import { NotInitializedError, pathManager, stateManager, ViewResourceTableParams } from 'amplify-cli-core';
import { hashElement, HashElementOptions } from 'folder-hash';
import * as fs from 'fs-extra';
import _ from 'lodash';
import * as path from 'path';
import { removeGetUserEndpoints } from '../amplify-helpers/remove-pinpoint-policy';
import { CLOUD_INITIALIZED, CLOUD_NOT_INITIALIZED, getCloudInitStatus } from './get-cloud-init-status';
import * as resourceStatus from './resource-status-diff';
import { capitalize, IResourceDiffCollection } from './resource-status-diff';
import { getHashForRootStack, isRootStackModifiedSinceLastPush } from './root-stack-status';

//API: Filter resource status for the given categories
export async function getMultiCategoryStatus(inputs: ViewResourceTableParams | undefined) {
  let resourceStatusResults = await getResourceStatus();
  if (inputs?.categoryList?.length) {
    //diffs for only the required categories (amplify -v <category1>...<categoryN>)
    //TBD: optimize search
    resourceStatusResults.resourcesToBeCreated = filterResourceCategory(resourceStatusResults.resourcesToBeCreated, inputs.categoryList);
    resourceStatusResults.resourcesToBeUpdated = filterResourceCategory(resourceStatusResults.resourcesToBeUpdated, inputs.categoryList);
    resourceStatusResults.resourcesToBeSynced = filterResourceCategory(resourceStatusResults.resourcesToBeSynced, inputs.categoryList);
    resourceStatusResults.resourcesToBeDeleted = filterResourceCategory(resourceStatusResults.resourcesToBeDeleted, inputs.categoryList);
    resourceStatusResults.allResources = filterResourceCategory(resourceStatusResults.allResources, inputs.categoryList);
  }
  return resourceStatusResults;
}

export async function getResourceDiffs(resourcesToBeUpdated, resourcesToBeDeleted, resourcesToBeCreated) {
  const result: IResourceDiffCollection = {
    updatedDiff: await resourceStatus.CollateResourceDiffs(resourcesToBeUpdated, resourceStatus.stackMutationType.UPDATE),
    deletedDiff: await resourceStatus.CollateResourceDiffs(resourcesToBeDeleted, resourceStatus.stackMutationType.DELETE),
    createdDiff: await resourceStatus.CollateResourceDiffs(resourcesToBeCreated, resourceStatus.stackMutationType.CREATE),
  };
  return result;
}

function resourceToTableRow(resource, operation) {
  return [capitalize(resource.category), resource.resourceName, operation /*syncOperationLabel*/, resource.providerPlugin];
}

const ResourceOperationLabel = {
  Create: 'Create',
  Update: 'Update',
  Delete: 'Delete',
  Import: 'Import',
  Unlink: 'Unlink',
  NoOp: 'No Change',
};

const TableColumnLabels = {
  Category: 'Category',
  ResourceName: 'Resource name',
  Operation: 'Operation',
  ProviderPlugin: 'Provider plugin',
};

function getLabelForResourceSyncOperation(syncOperationType: string) {
  switch (syncOperationType) {
    case 'import':
      return ResourceOperationLabel.Import;
    case 'unlink':
      return ResourceOperationLabel.Unlink;
    default:
      // including refresh
      return ResourceOperationLabel.NoOp;
  }
}

export function getSummaryTableData({
  resourcesToBeUpdated,
  resourcesToBeDeleted,
  resourcesToBeCreated,
  resourcesToBeSynced,
  allResources,
}) {
  let noChangeResources = _.differenceWith(
    allResources,
    resourcesToBeCreated.concat(resourcesToBeUpdated).concat(resourcesToBeSynced),
    _.isEqual,
  );
  noChangeResources = noChangeResources.filter(resource => resource.category !== 'providers');

  const tableOptions = [
    [TableColumnLabels.Category, TableColumnLabels.ResourceName, TableColumnLabels.Operation, TableColumnLabels.ProviderPlugin],
  ];

  for (const resource of resourcesToBeCreated) {
    tableOptions.push(resourceToTableRow(resource, ResourceOperationLabel.Create));
  }

  for (const resource of resourcesToBeUpdated) {
    tableOptions.push(resourceToTableRow(resource, ResourceOperationLabel.Update));
  }

  for (const resource of resourcesToBeSynced) {
    const operation = getLabelForResourceSyncOperation(resource.sync);
    tableOptions.push(resourceToTableRow(resource, operation /*syncOperationLabel*/));
  }

  for (const resource of resourcesToBeDeleted) {
    tableOptions.push(resourceToTableRow(resource, ResourceOperationLabel.Delete));
  }

  for (const resource of noChangeResources) {
    tableOptions.push(resourceToTableRow(resource, ResourceOperationLabel.NoOp));
  }
  return tableOptions;
}
//API: get resources which need to be created/updated/synced/deleted and associated data (tagUpdated)
export async function getResourceStatus(
  category?,
  resourceName?,
  providerName?,
  filteredResources?,
): Promise<resourceStatus.ICategoryStatusCollection> {
  let { amplifyMeta, currentAmplifyMeta } = getAmplifyMeta();
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

  // if not equal there is a root stack update
  const rootStackUpdated = await isRootStackModifiedSinceLastPush(getHashForRootStack);

  return {
    resourcesToBeCreated,
    resourcesToBeUpdated,
    resourcesToBeSynced,
    resourcesToBeDeleted,
    rootStackUpdated,
    tagsUpdated,
    allResources,
  };
}

export function getAllResources(amplifyMeta, category, resourceName, filteredResources) {
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

export function getResourcesToBeCreated(amplifyMeta, currentAmplifyMeta, category, resourceName, filteredResources) {
  let resources: any[] = [];

  Object.keys(amplifyMeta).forEach(categoryName => {
    const categoryItem = amplifyMeta[categoryName];
    Object.keys(categoryItem).forEach(resource => {
      if (
        (!amplifyMeta[categoryName][resource]?.lastPushTimeStamp ||
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
          (!amplifyMeta[dependsOnCategory][dependsOnResourcename]?.lastPushTimeStamp ||
            !currentAmplifyMeta[dependsOnCategory] ||
            !currentAmplifyMeta[dependsOnCategory][dependsOnResourcename]) &&
          amplifyMeta[dependsOnCategory][dependsOnResourcename] &&
          amplifyMeta[dependsOnCategory][dependsOnResourcename]?.serviceType !== 'imported' &&
          !resources.includes(amplifyMeta[dependsOnCategory][dependsOnResourcename])
        ) {
          resources.push(amplifyMeta[dependsOnCategory][dependsOnResourcename]);
        }
      }
    }
  }

  return _.uniqWith(resources, _.isEqual);
}

export function getResourcesToBeDeleted(amplifyMeta, currentAmplifyMeta, category, resourceName, filteredResources) {
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

export async function getResourcesToBeUpdated(amplifyMeta, currentAmplifyMeta, category, resourceName, filteredResources) {
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
            currentAmplifyMeta[categoryName][resource]?.lastPushTimeStamp,
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
            currentAmplifyMeta[categoryName][resource]?.lastPushTimeStamp,
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

export function getResourcesToBeSynced(amplifyMeta, currentAmplifyMeta, category, resourceName, filteredResources) {
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

//API: get amplify metadata based on cloud-init status.
export function getAmplifyMeta() {
  const amplifyProjectInitStatus = getCloudInitStatus();
  if (amplifyProjectInitStatus === CLOUD_INITIALIZED) {
    return {
      amplifyMeta: stateManager.getMeta(),
      currentAmplifyMeta: stateManager.getCurrentMeta(),
    };
  } else if (amplifyProjectInitStatus === CLOUD_NOT_INITIALIZED) {
    return {
      amplifyMeta: stateManager.getBackendConfig(),
      currentAmplifyMeta: {},
    };
  } else {
    throw new NotInitializedError();
  }
}

//helper: Check if directory has been modified by comparing hash values
async function isBackendDirModifiedSinceLastPush(resourceName, category, lastPushTimeStamp, hashFunction) {
  // Pushing the resource for the first time hence no lastPushTimeStamp
  if (!lastPushTimeStamp) {
    return false;
  }
  const localBackendDir = path.normalize(path.join(pathManager.getBackendDirPath(), category, resourceName));
  const cloudBackendDir = path.normalize(path.join(pathManager.getCurrentCloudBackendDirPath(), category, resourceName));

  if (!fs.existsSync(localBackendDir) || !fs.existsSync(cloudBackendDir)) {
    return false;
  }

  const localDirHash = await hashFunction(localBackendDir, resourceName);
  const cloudDirHash = await hashFunction(cloudBackendDir, resourceName);

  return localDirHash !== cloudDirHash;
}

//API: calculate hash for resource directory : TBD move to library
export function getHashForResourceDir(dirPath, files?: string[]) {
  const options: HashElementOptions = {
    folders: { exclude: ['.*', 'node_modules', 'test_coverage', 'dist', 'build'] },
    files: {
      include: files,
    },
  };
  return hashElement(dirPath, options).then(result => result.hash);
}

//helper: remove specified resources from list of given resources
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
//helper: validate category of the resource
function resourceBelongsToCategoryList(category, categoryList) {
  if (typeof category === 'string') {
    return categoryList.includes(category);
  } else {
    return false;
  }
}
//helper: filter resources based on category
function filterResourceCategory(resourceList, categoryList) {
  return resourceList ? resourceList.filter(resource => resourceBelongsToCategoryList(resource.category, categoryList)) : [];
}

//Get the name of the AWS service provisioning the resource
export function getResourceService(category: string, resourceName: string) {
  let { amplifyMeta } = getAmplifyMeta();
  const categoryMeta = amplifyMeta ? amplifyMeta[category] : {};
  return categoryMeta[resourceName]?.service;
}

//helper to await results of all function calls
//TODO: replace with 'await for of'
async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; ++index) {
    await callback(array[index], index, array);
  }
}
