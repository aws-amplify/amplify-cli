import { ViewResourceTableParams, $TSAny } from 'amplify-cli-core';
import { print } from './print';
import { CLOUD_INITIALIZED, getCloudInitStatus } from './get-cloud-init-status';
import { viewSummaryTable, viewEnvInfo, viewResourceDiffs } from './resource-status-view';
import { getMultiCategoryStatus, getResourceStatus, getHashForResourceDir } from './resource-status-data';

export { getResourceStatus, getHashForResourceDir };

/**
 * CLI View function to display resource summary or verbose status
 */
export const showStatusTable = async (tableViewFilter: ViewResourceTableParams):Promise<boolean> => {
  const amplifyProjectInitStatus = getCloudInitStatus();
  const {
    resourcesToBeCreated,
    resourcesToBeUpdated,
    resourcesToBeDeleted,
    resourcesToBeSynced,
    rootStackUpdated,
    allResources,
    tagsUpdated,
  } = await getMultiCategoryStatus(tableViewFilter);

  // 1. Display Environment Info
  if (amplifyProjectInitStatus === CLOUD_INITIALIZED) {
    viewEnvInfo();
  }
  // 2. Display Summary Table
  viewSummaryTable({
    resourcesToBeUpdated, resourcesToBeCreated, resourcesToBeDeleted, resourcesToBeSynced, allResources,
  });
  // 3. Display Tags Status
  if (tagsUpdated) {
    print.info('\nTag Changes Detected');
  }

  // 4. Display Detailed Diffs (Cfn/NonCfn)
  if (tableViewFilter.verbose) {
    await viewResourceDiffs({ resourcesToBeUpdated, resourcesToBeDeleted, resourcesToBeCreated });
  }

  const isResourceChanged = resourcesToBeCreated.length + resourcesToBeUpdated.length
                             + resourcesToBeSynced.length + resourcesToBeDeleted.length > 0 || !!tagsUpdated;

  return isResourceChanged;
};

/**
 * CLI view function for resource summary.
 */
export const showResourceTable = async (category?: string, resourceName?:string, filteredResources?:Array<$TSAny>):Promise<boolean> => {
  const amplifyProjectInitStatus = getCloudInitStatus();

  // Prepare state for view
  const {
    resourcesToBeCreated,
    resourcesToBeUpdated,
    resourcesToBeDeleted,
    resourcesToBeSynced,
    allResources,
    tagsUpdated,
    rootStackUpdated,
  } = await getResourceStatus(category, resourceName, undefined, filteredResources);

  // 1. Display Environment Info
  if (amplifyProjectInitStatus === CLOUD_INITIALIZED) {
    viewEnvInfo();
  }
  // 2. Display Summary Table
  viewSummaryTable({
    resourcesToBeUpdated, resourcesToBeCreated, resourcesToBeDeleted, resourcesToBeSynced, allResources,
  });
  // 3. Display Tags Status
  if (tagsUpdated) {
    print.info('\nTag Changes Detected');
  }

  const resourceChanged = resourcesToBeCreated.length + resourcesToBeUpdated.length
  + resourcesToBeSynced.length + resourcesToBeDeleted.length > 0
    || !!tagsUpdated
    || !!rootStackUpdated;

  return resourceChanged;
};
