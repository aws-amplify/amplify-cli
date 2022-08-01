/* eslint-disable spellcheck/spell-checker */
import chalk from 'chalk';
import columnify from 'columnify';
import { MultiProgressBar } from 'amplify-prompts';

const COLUMNIFY_WIDTH = 30;

const CFN_SUCCESS_STATUS = [
  'UPDATE_COMPLETE', 'CREATE_COMPLETE', 'DELETE_COMPLETE',
  'DELETE_SKIPPED', 'UPDATE_ROLLBACK_COMPLETE', 'ROLLBACK_COMPLETE',
];
const CNF_ERROR_STATUS = [
  'CREATE_FAILED', 'DELETE_FAILED', 'UPDATE_FAILED',
  'UPDATE_ROLLBACK_FAILED', 'ROLLBACK_FAILED',
];

type ItemPayload = {
  LogicalResourceId: string,
  ResourceType: string,
  ResourceStatus: string,
  Timestamp: string,
}

type ProgressPayload = {
  progressName: string,
  envName: string
}

type EventMap = {
  rootStackName: string,
  envName: string,
  projectName: string,
  rootResources: string[],
  eventToCategories: Map<string, string>,
  categories: {name: string, size: number}[]
}
/**
 * Custom item formatter for progress bar
 */
const createItemFormatter = (payload: ItemPayload) : string => {
  const e = [{
    logicalResourceId: payload.LogicalResourceId,
    resourceType: payload.ResourceType,
    resourceStatus: payload.ResourceStatus,
    timeStamp: (new Date(payload.Timestamp)).toString(),
  }];

  let output = columnify(e, {
    showHeaders: false,
    truncate: true,
    maxWidth: COLUMNIFY_WIDTH,
    minWidth: COLUMNIFY_WIDTH,
  });

  if (CFN_SUCCESS_STATUS.includes(payload.ResourceStatus)) {
    output = chalk.green(output);
  }
  if (CNF_ERROR_STATUS.includes(payload.ResourceStatus)) {
    output = chalk.red(output);
  }
  return output;
};

/**
 * Custom progress bar formatter
 */
const createProgressBarFormatter = (payload : ProgressPayload,
  value: number,
  total: number) : string => {
  let statusString = 'Deploying';
  const progressNameParts = payload.progressName.split('-');
  const name = progressNameParts.length === 1 ? progressNameParts[0] : `${progressNameParts[0]} ${progressNameParts[1]}`;
  if (total === value) {
    statusString = 'Deployed';
  }
  return `${statusString} ${name}`;
};

/**
 * Initializing the root and individual category bars
 */
const initializeProgressBars = (eventMap : EventMap) : MultiProgressBar => {
  const newMultiBar = new MultiProgressBar({
    progressBarFormatter: createProgressBarFormatter,
    itemFormatter: createItemFormatter,
    loneWolf: false,
    hideCursor: true,
    barSize: 40,
    itemCompleteStatus: CFN_SUCCESS_STATUS,
    itemFailedStatus: CNF_ERROR_STATUS,
    prefixText: `Deploying resources into ${eventMap.envName} environment. This will take a few minutes.`,
    successText: 'Deployment Completed',
    failureText: 'Deployment Failed',
    barCompleteChar: '=',
    barIncompleteChar: '-',
  });

  let progressBarsConfigs = [];
  progressBarsConfigs.push({
    name: 'projectBar',
    value: 0,
    total: 1 + eventMap.rootResources.length,
    payload: {
      progressName: `root stack-${eventMap.projectName}`,
      envName: eventMap.envName,
    },
  });

  progressBarsConfigs = eventMap.categories.reduce(
    (prev, curr) => prev.concat({
      name: curr.name,
      value: 0,
      total: curr.size,
      payload: {
        progressName: curr.name,
        envName: eventMap.envName,
      },
    }), progressBarsConfigs,
  );

  newMultiBar.create(progressBarsConfigs);
  return newMultiBar;
};

export {
  createItemFormatter,
  createProgressBarFormatter,
  initializeProgressBars,
};
