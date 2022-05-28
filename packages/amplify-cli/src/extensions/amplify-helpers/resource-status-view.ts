import chalk from 'chalk';
import { getSummaryTableData, getResourceDiffs, IResourceGroups } from './resource-status-data';
import * as resourceStatus from './resource-status-diff';
import { getEnvInfo } from './get-env-info';
import { print } from './print';

/**
 *  View: displays resource-diff (cloudformation-diff, input parameters (pending))
 * @param param0 Amplify resources split by the action ( create, update, delete)
 * @param param0.resourcesToBeCreated - Resource metadata for resources to be created in next amplify push
 * @param param0.resourcesToBeUpdated - Resource metadata for resources to be updated in next amplify push
 * @param param0.resourcesToBeDeleted - Resource metadata for resources to be deleted in next amplify push
 */
export const viewResourceDiffs = async ({ resourcesToBeUpdated, resourcesToBeDeleted, resourcesToBeCreated }) : Promise<void> => {
  const resourceDiffs = await getResourceDiffs(resourcesToBeUpdated, resourcesToBeDeleted, resourcesToBeCreated);
  for await (const resourceDiff of resourceDiffs.updatedDiff) {
    // Print with UPDATE styling theme
    resourceDiff.printResourceDetailStatus(resourceStatus.stackMutationType.UPDATE);
  }
  for await (const resourceDiff of resourceDiffs.deletedDiff) {
    // Print with DELETE styling theme
    resourceDiff.printResourceDetailStatus(resourceStatus.stackMutationType.DELETE);
  }
  for await (const resourceDiff of resourceDiffs.createdDiff) {
    // Print with CREATE styling theme
    resourceDiff.printResourceDetailStatus(resourceStatus.stackMutationType.CREATE);
  }
};

/**
 * View: Display environment specific information
 */
export const viewEnvInfo = (): void => {
  const { envName } = getEnvInfo();
  print.info(`
    ${chalk.green('Current Environment')}: ${envName}
    `);
};

/**
 * View: displays status-summary table
 * @param resourceStateData - Amplify resources split into groups by CLI action ( create, update, remove )
 */
export const viewSummaryTable = (resourceStateData: IResourceGroups): void => {
  const tableOptions = getSummaryTableData(resourceStateData);
  const { table } = print;
  table(tableOptions, { format: 'lean' });
};
