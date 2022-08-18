/* eslint-disable spellcheck/spell-checker */
import { MultiProgressBar } from 'amplify-prompts';

import {
  createProgressBarFormatter,
  createItemFormatter,
  CFN_SUCCESS_STATUS,
  CNF_ERROR_STATUS,
  EventMap,
} from '../utils/progress-bar-helpers';

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
    successText: 'Deployment completed.',
    failureText: 'Deployment failed.',
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
  if (newMultiBar.isTTY()) {
    newMultiBar.create(progressBarsConfigs);
  }
  return newMultiBar;
};

export {
  initializeProgressBars,
};
