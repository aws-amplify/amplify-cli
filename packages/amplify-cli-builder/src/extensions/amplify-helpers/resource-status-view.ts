import { getSummaryTableData, getResourceDiffs } from './resource-status-data';
import * as resourceStatus from './resource-status-diff';
import { getEnvInfo } from './get-env-info';
import { print } from './print';
import chalk from 'chalk';
//view: displays resource-diff (cloudformation-diff, input parameters (pending))
export async function viewResourceDiffs({ resourcesToBeUpdated, resourcesToBeDeleted, resourcesToBeCreated }) {
  const resourceDiffs = await getResourceDiffs(resourcesToBeUpdated, resourcesToBeDeleted, resourcesToBeCreated);
  for await (const resourceDiff of resourceDiffs.updatedDiff) {
    //Print with UPDATE styling theme
    resourceDiff.printResourceDetailStatus(resourceStatus.stackMutationType.UPDATE);
  }
  for await (let resourceDiff of resourceDiffs.deletedDiff) {
    //Print with DELETE styling theme
    resourceDiff.printResourceDetailStatus(resourceStatus.stackMutationType.DELETE);
  }
  for await (let resourceDiff of resourceDiffs.createdDiff) {
    //Print with CREATE styling theme
    resourceDiff.printResourceDetailStatus(resourceStatus.stackMutationType.CREATE);
  }
}

//view: displays environment specific info
export function viewEnvInfo() {
  const { envName } = getEnvInfo();
  print.info(`
    ${chalk.green('Current Environment')}: ${envName}
    `);
}

//view: displays status-summary table
export function viewSummaryTable(resourceStateData) {
  const tableOptions = getSummaryTableData(resourceStateData);
  const { table } = print;
  table(tableOptions, { format: 'lean' });
}
