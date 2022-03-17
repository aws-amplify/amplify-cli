import { $TSContext } from 'amplify-cli-core';
import { preInitSetup } from '../init-steps/preInitSetup';
import { postInitSetup } from '../init-steps/postInitSetup';
import { analyzeProject, analyzeProjectHeadless } from '../init-steps/s0-analyzeProject';
import { initFrontend } from '../init-steps/s1-initFrontend';
import { initProviders } from '../init-steps/s2-initProviders';
import { scaffoldProjectHeadless } from '../init-steps/s8-scaffoldHeadless';
import { onFailure } from '../init-steps/s9-onFailure';
import { onHeadlessSuccess, onSuccess } from '../init-steps/s9-onSuccess';
import { constructInputParams } from '../amplify-service-helper';
import { raisePostEnvAddEvent } from '../execution-manager';

function constructExeInfo(context: $TSContext) {
  context.exeInfo = {
    inputParams: constructInputParams(context),
  };
}

const runStrategy = (quickstart: boolean) => {
  return quickstart
    ? [preInitSetup, analyzeProjectHeadless, scaffoldProjectHeadless, onHeadlessSuccess]
    : [preInitSetup, analyzeProject, initFrontend, initProviders, onSuccess, postInitSetup];
};

export const run = async (context: $TSContext) => {
  constructExeInfo(context);
  const steps = runStrategy(context?.parameters?.options?.quickstart);
  try {
    for (const step of steps) {
      await step(context);
    }
    if (context.exeInfo.sourceEnvName && context.exeInfo.localEnvInfo.envName) {
      await raisePostEnvAddEvent(context as any, context.exeInfo.sourceEnvName, context.exeInfo.localEnvInfo.envName);
    }
  } catch (e) {
    context.usageData.emitError(e);
    onFailure(e);
  }
};
