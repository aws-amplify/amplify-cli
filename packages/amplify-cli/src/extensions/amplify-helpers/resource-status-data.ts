/* eslint-disable max-depth */
/* eslint-disable spellcheck/spell-checker */
/* eslint-disable no-param-reassign */
/* eslint-disable import/no-cycle */
import { hashLayerResource, ServiceName as FunctionServiceName } from '@aws-amplify/amplify-category-function';
import {
  $TSAny,
  pathManager, projectNotInitializedError, stateManager, ViewResourceTableParams,
} from 'amplify-cli-core';
import { hashElement, HashElementOptions } from 'folder-hash';
import * as fs from 'fs-extra';
import _ from 'lodash';
import * as path from 'path';
import { removeGetUserEndpoints } from './remove-pinpoint-policy';
import { CLOUD_INITIALIZED, CLOUD_NOT_INITIALIZED, getCloudInitStatus } from './get-cloud-init-status';
import * as resourceStatus from './resource-status-diff';
import { capitalize, IResourceDiffCollection } from './resource-status-diff';
import { getHashForRootStack, isRootStackModifiedSinceLastPush } from './root-stack-status';

/**
 * Resources separated by their states Created, Updated, Deleted, Synced and all (merged)
 */
export interface IResourceGroups {
  resourcesToBeUpdated: Array<$TSAny>,
  resourcesToBeDeleted: Array<$TSAny>,
  resourcesToBeCreated: Array<$TSAny>,
  resourcesToBeSynced : Array<$TSAny>,
  allResources: Array<$TSAny>,
  rootStackUpdated?: boolean,
  tagsUpdated?: boolean,
}

// Place holder for Summary cell types
// This type should be determined by the resource summary;
type SummaryCell = $TSAny;
type SummaryRow = Array<SummaryCell>;
type SummaryTable = Array<SummaryRow>;

/**
 * API: Filter resource status for the given categories
 */
export const getMultiCategoryStatus = async (inputs: ViewResourceTableParams | undefined): Promise<IResourceGroups> => {
  const resourceStatusResults = await getResourceStatus();
  if (inputs?.categoryList?.length) {
    // diffs for only the required categories (amplify -v <category1>...<categoryN>)
    resourceStatusResults.resourcesToBeCreated = filterResourceCategory(resourceStatusResults.resourcesToBeCreated, inputs.categoryList);
    resourceStatusResults.resourcesToBeUpdated = filterResourceCategory(resourceStatusResults.resourcesToBeUpdated, inputs.categoryList);
    resourceStatusResults.resourcesToBeSynced = filterResourceCategory(resourceStatusResults.resourcesToBeSynced, inputs.categoryList);
    resourceStatusResults.resourcesToBeDeleted = filterResourceCategory(resourceStatusResults.resourcesToBeDeleted, inputs.categoryList);
    resourceStatusResults.allResources = filterResourceCategory(resourceStatusResults.allResources, inputs.categoryList);
  }
  return resourceStatusResults;
};

/**
 * Call the Diff function of each resource
 */
export const getResourceDiffs = async (
  resourcesToBeUpdated: Array<$TSAny>,
  resourcesToBeDeleted:Array<$TSAny>,
  resourcesToBeCreated: Array<$TSAny>,
): Promise<IResourceDiffCollection> => {
  const result: IResourceDiffCollection = {
    updatedDiff: await resourceStatus.CollateResourceDiffs(resourcesToBeUpdated, resourceStatus.stackMutationType.UPDATE),
    deletedDiff: await resourceStatus.CollateResourceDiffs(resourcesToBeDeleted, resourceStatus.stackMutationType.DELETE),
    createdDiff: await resourceStatus.CollateResourceDiffs(resourcesToBeCreated, resourceStatus.stackMutationType.CREATE),
  };
  return result;
};

const resourceToTableRow = (
  resource: $TSAny,
  operation: string,
): Array<string> => [capitalize(resource.category), resource.resourceName, operation /* syncOperationLabel*/, resource.providerPlugin];

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

const getLabelForResourceSyncOperation = (syncOperationType: string): string => {
  switch (syncOperationType) {
    case 'import':
      return ResourceOperationLabel.Import;
    case 'unlink':
      return ResourceOperationLabel.Unlink;
    default:
      // including refresh
      return ResourceOperationLabel.NoOp;
  }
};

/**
 * Get the Summary table data for 'amplify status'
 */
export const getSummaryTableData = ({
  resourcesToBeUpdated,
  resourcesToBeDeleted,
  resourcesToBeCreated,
  resourcesToBeSynced,
  allResources,
}): SummaryTable => {
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
    tableOptions.push(resourceToTableRow(resource, operation /* syncOperationLabel*/));
  }

  for (const resource of resourcesToBeDeleted) {
    tableOptions.push(resourceToTableRow(resource, ResourceOperationLabel.Delete));
  }

  for (const resource of noChangeResources) {
    tableOptions.push(resourceToTableRow(resource, ResourceOperationLabel.NoOp));
  }
  return tableOptions;
};

interface IBackendConfigs{
  currentBackendConfig: $TSAny,
  backendConfig: $TSAny
}

/**
 * API: get resources which need to be created/updated/synced/deleted and associated data (tagUpdated)
 * @param category Amplify category folder to query for resources
 * @param resourceName Resource created for the given category
 * @param providerName cloudformation
 * @param filteredResources  Resources to be ignored in the results
 */
export const getResourceStatus = async (
  category? : string,
  resourceName? : string,
  providerName? : string,
  filteredResources? : Array<$TSAny>,
): Promise<resourceStatus.ICategoryStatusCollection> => {
  const { amplifyMeta, currentAmplifyMeta } = getAmplifyMeta();
  const backendConfigs = getLocalAndDeployedBackendConfig();
  let resourcesToBeCreated: $TSAny = getResourcesToBeCreated(amplifyMeta, currentAmplifyMeta, category, resourceName, filteredResources);
  let resourcesToBeUpdated: $TSAny = await getResourcesToBeUpdated(amplifyMeta, currentAmplifyMeta, backendConfigs,
    category, resourceName, filteredResources);
  let resourcesToBeSynced: $TSAny = getResourcesToBeSynced(amplifyMeta, currentAmplifyMeta, category, resourceName, filteredResources);
  let resourcesToBeDeleted: $TSAny = getResourcesToBeDeleted(amplifyMeta, currentAmplifyMeta, category, resourceName, filteredResources);
  let allResources: $TSAny = getAllResources(amplifyMeta, category, resourceName, filteredResources);

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
};

/**
 * Get the list of all resources
 */
export const getAllResources = (amplifyMeta: $TSAny, category: $TSAny, resourceName: string|undefined,
  filteredResources: Array<$TSAny>|undefined) : Array<$TSAny> => {
  let resources: $TSAny[] = [];

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
};

/**
 * Query metadata and get resources to be created.
 * Typically a resource to be created exists in backend-config but not in #currentBackend/amplify-meta
 */
export const getResourcesToBeCreated = (amplifyMeta:$TSAny, currentAmplifyMeta: $TSAny,
  category: string|undefined, resourceName: string|undefined,
  filteredResources: Array<$TSAny>|undefined): Array<$TSAny> => {
  let resources: $TSAny[] = [];

  Object.keys(amplifyMeta).forEach(categoryName => {
    const categoryItem = amplifyMeta[categoryName];
    Object.keys(categoryItem).forEach(resource => {
      if (
        (!amplifyMeta[categoryName][resource]?.lastPushTimeStamp
          || !currentAmplifyMeta[categoryName]
          || !currentAmplifyMeta[categoryName][resource])
        && categoryName !== 'providers'
        && amplifyMeta[categoryName][resource].serviceType !== 'imported'
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
        const dependsOnResourceName = resources[i].dependsOn[j].resourceName;
        if (
          amplifyMeta[dependsOnCategory]
          && (!amplifyMeta[dependsOnCategory][dependsOnResourceName]?.lastPushTimeStamp
            || !currentAmplifyMeta[dependsOnCategory]
            || !currentAmplifyMeta[dependsOnCategory][dependsOnResourceName])
          && amplifyMeta[dependsOnCategory][dependsOnResourceName]
          && amplifyMeta[dependsOnCategory][dependsOnResourceName]?.serviceType !== 'imported'
          && !resources.includes(amplifyMeta[dependsOnCategory][dependsOnResourceName])
        ) {
          resources.push(amplifyMeta[dependsOnCategory][dependsOnResourceName]);
        }
      }
    }
  }

  return _.uniqWith(resources, _.isEqual);
};

/**
 * Query metadata and get resources to be deleted.
 * Typically a resource to be deleted exists both in backend-config and in #currentBackend/amplify-meta
 */
export const getResourcesToBeDeleted = (amplifyMeta : $TSAny, currentAmplifyMeta: $TSAny, category : string|undefined,
  resourceName: string|undefined, filteredResources: Array<$TSAny>|undefined):Array<$TSAny> => {
  let resources: $TSAny[] = [];

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
};

/**
 * Compares the contents of the backendConfig files from backend and #currentCloudBackend
 */
const isBackendConfigModifiedSinceLastPush = (categoryName: string, resourceName: string, backendConfigs: IBackendConfigs): boolean => {
  if ((backendConfigs.backendConfig && backendConfigs.currentBackendConfig)) {
    const deployedCategoryBackendConfig = (categoryName in backendConfigs.currentBackendConfig)
      ? backendConfigs.currentBackendConfig[categoryName] : undefined;
    const categoryBackendConfig = (categoryName in backendConfigs.backendConfig)
      ? backendConfigs.backendConfig[categoryName] : undefined;
    const deployedResource = (deployedCategoryBackendConfig) ? deployedCategoryBackendConfig[resourceName] : undefined;
    const categoryResource = (categoryBackendConfig) ? categoryBackendConfig[resourceName] : undefined;
    // resource is configured in both backendConfig files, check for equality
    if (deployedResource && categoryResource) {
      return (JSON.stringify(deployedResource).normalize() !== JSON.stringify(categoryResource).normalize());
    }
    if (categoryResource) {
      return true;
    }
    return false;
  }
  // if backend has resource but not deployed
  return !!backendConfigs.backendConfig?.[categoryName]?.[resourceName];
};

/**
* Query metadata and get resources to be updated.
* Typically a resource to be updated has a different has value in amplify-meta vs #currentBackend/amplify-meta
*/
export const getResourcesToBeUpdated = async (
  amplifyMeta : $TSAny,
  currentAmplifyMeta: $TSAny,
  backendConfigs: IBackendConfigs,
  category: string|undefined,
  resourceName: string|undefined, filteredResources: Array<$TSAny>|undefined,
): Promise<$TSAny[]> => {
  let resources: $TSAny[] = [];

  await asyncForEach(Object.keys(amplifyMeta), async categoryName => {
    const categoryItem = amplifyMeta[categoryName];
    await asyncForEach(Object.keys(categoryItem), async resource => {
      if (categoryName === 'analytics') {
        removeGetUserEndpoints(resource);
      }

      if (
        currentAmplifyMeta[categoryName]
        && currentAmplifyMeta[categoryName][resource] !== undefined
        && amplifyMeta[categoryName]
        && amplifyMeta[categoryName][resource] !== undefined
        && amplifyMeta[categoryName][resource].serviceType !== 'imported'
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
          const backendConfigModified = isBackendConfigModifiedSinceLastPush(categoryName, resource, backendConfigs);
          const backendModified = (backendConfigModified) || await isBackendDirModifiedSinceLastPush(
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
            // build absolute path for Docker file and docker-compose.yaml
            const projectRootPath = pathManager.findProjectRoot();
            if (projectRootPath) {
              const sourceAbsolutePath = path.join(projectRootPath, SourceDir);

              // Generate the hash for this file, cfn files are auto-generated based on Docker file and resource settings
              // Hash is generated by this files and not cfn files
              const dockerFileHash = await getHashForResourceDir(sourceAbsolutePath, [
                'Dockerfile',
                'docker-compose.yaml',
                'docker-compose.yml',
              ]);

              // Compare hash with value stored on meta
              if (currentAmplifyMeta[categoryName][resource].lastPushDirHash !== dockerFileHash) {
                resources.push(amplifyMeta[categoryName][resource]);
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
};

/**
* Query metadata and get resources to be synced.
* Typically a resource to be updated has a different has value in amplify-meta vs #currentBackend/amplify-meta
*/
export const getResourcesToBeSynced = (amplifyMeta : $TSAny, currentAmplifyMeta: $TSAny,
  category: string|undefined, resourceName: string|undefined,
  filteredResources: Array<$TSAny>|undefined): Array<$TSAny> => {
  let resources: Array<$TSAny> = [];

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
          _.get(currentAmplifyMeta, [categoryName, resource], undefined) === undefined
          && _.get(amplifyMeta, [categoryName, resource], undefined) !== undefined
        ) {
          amplifyMeta[categoryName][resource].resourceName = resource;
          amplifyMeta[categoryName][resource].category = categoryName;
          amplifyMeta[categoryName][resource].sync = 'import';

          resources.push(amplifyMeta[categoryName][resource]);
        } else if (
          _.get(currentAmplifyMeta, [categoryName, resource], undefined) !== undefined
          && _.get(amplifyMeta, [categoryName, resource], undefined) === undefined
        ) {
          // Removed
          amplifyMeta[categoryName][resource].resourceName = resource;
          amplifyMeta[categoryName][resource].category = categoryName;
          amplifyMeta[categoryName][resource].sync = 'unlink';

          resources.push(amplifyMeta[categoryName][resource]);
        } else if (
          _.get(currentAmplifyMeta, [categoryName, resource], undefined) !== undefined
          && _.get(amplifyMeta, [categoryName, resource], undefined) !== undefined
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
          _.get(currentAmplifyMeta, [categoryName, resource], undefined) !== undefined
          && _.get(amplifyMeta, [categoryName, resource], undefined) === undefined
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
};

/**
 * API: get amplify metadata based on cloud-init status.
 */
export const getAmplifyMeta = ():$TSAny => {
  const amplifyProjectInitStatus = getCloudInitStatus();
  if (amplifyProjectInitStatus === CLOUD_INITIALIZED) {
    return {
      amplifyMeta: stateManager.getMeta(),
      currentAmplifyMeta: stateManager.getCurrentMeta(),
    };
  }

  if (amplifyProjectInitStatus === CLOUD_NOT_INITIALIZED) {
    return {
      amplifyMeta: stateManager.getBackendConfig(),
      currentAmplifyMeta: {},
    };
  }
  throw projectNotInitializedError();
};

/**
 * API: get amplify backend config
 */
export const getLocalAndDeployedBackendConfig = (): IBackendConfigs => {
  let currentBackendConfig:$TSAny;
  let backendConfig:$TSAny;
  try {
    currentBackendConfig = stateManager.getCurrentBackendConfig();
  // eslint-disable-next-line no-empty
  } catch (e) {} // this will fail on iniEnv;

  try {
    backendConfig = stateManager.getBackendConfig();
  // eslint-disable-next-line no-empty
  } catch (e) {} // this will fail on iniEnv;

  return {
    backendConfig,
    currentBackendConfig,
  };
};

// helper: Check if directory has been modified by comparing hash values
const isBackendDirModifiedSinceLastPush = async (resourceName: string, category: string,
  lastPushTimeStamp: string, hashFunction: $TSAny): Promise<boolean> => {
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
};

/**
 * API: calculate hash for resource directory : TBD move to library
 */
export const getHashForResourceDir = async (dirPath: string, files?:string[]): Promise<string> => {
  const options: HashElementOptions = {
    folders: { exclude: ['.*', 'node_modules', 'test_coverage', 'dist', 'build'] },
    files: {
      include: files,
    },
  };
  return hashElement(dirPath, options).then(result => result.hash);
};

// helper: remove specified resources from list of given resources
const filterResources = (resources: Array<$TSAny>, filteredResources: Array<$TSAny>|undefined):Array<$TSAny> => {
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
};

// helper: validate category of the resource
const resourceBelongsToCategoryList = (category, categoryList):boolean => {
  if (typeof category === 'string') {
    return categoryList.includes(category);
  }
  return false;
};

// helper: filter resources based on category
const filterResourceCategory = (resourceList:Array<$TSAny>, categoryList:Array<$TSAny>): Array<$TSAny> => (resourceList
  ? resourceList.filter(resource => resourceBelongsToCategoryList(resource.category, categoryList))
  : []);

/**
 * Get the name of the AWS service provisioning the resource
 */
export const getResourceService = (category: string, resourceName: string): string => {
  const { amplifyMeta } = getAmplifyMeta();
  const categoryMeta = amplifyMeta ? amplifyMeta[category] : {};
  return categoryMeta[resourceName]?.service;
};

// helper to await results of all function calls
// TODO: replace with 'await for of'
const asyncForEach = async (array: Array<$TSAny>, callback:$TSAny):Promise<$TSAny> => {
  for (let index = 0; index < array.length; ++index) {
    await callback(array[index], index, array);
  }
};
