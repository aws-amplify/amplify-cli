

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
  print.info(`\n${chalk.blueBright("Note: ")}Please use 'amplify status ${ chalk.greenBright("-v")}' to view detailed status and cloudformation-diff.\n`);

  const resourceChanged =
    resourcesToBeCreated.length + resourcesToBeUpdated.length + resourcesToBeSynced.length + resourcesToBeDeleted.length > 0 || tagsUpdated;

  return resourceChanged;
}
