import { $TSContext, exitOnNextTick } from 'amplify-cli-core';
import { preInitSetup } from '../init-steps/preInitSetup';
import { postInitSetup } from '../init-steps/postInitSetup';
import { analyzeProject, analyzeProjectHeadless } from '../init-steps/s0-analyzeProject';
import { initFrontend } from '../init-steps/s1-initFrontend';
import { initProviders } from '../init-steps/s2-initProviders';
import { scaffoldProjectHeadless } from '../init-steps/s8-scaffoldHeadless';
import { onFailure } from '../init-steps/s9-onFailure';
import { onHeadlessSuccess as onSuccessHeadless, onSuccess } from '../init-steps/s9-onSuccess';
import { constructInputParams } from '../amplify-service-helper';
import { promisify } from 'util';

function constructExeInfo(context: $TSContext) {
  context.exeInfo = {
    inputParams: constructInputParams(context),
  };
}

const runStrategy = (context: $TSContext) => {
  if (context.parameters.options.quickstart) {
    return [
      preInitSetup,
      analyzeProjectHeadless,
      initFrontend,
      scaffoldProjectHeadless,
      onSuccessHeadless,
      promisify((_: $TSContext) => {
        exitOnNextTick(0)
      }),
    ];
  }
  return [ preInitSetup, analyzeProject, initFrontend, initProviders, onSuccess ];
}

export const run = async (context: $TSContext) => {
  constructExeInfo(context);
  const steps = runStrategy(context);
  try {
    for (const step of steps) {
      await step(context);
    }
  } catch (e) {
    context.usageData.emitError(e);
    onFailure(e);
  }

  try {
    await postInitSetup(context);
  } catch (e) {
    context.usageData.emitError(e);
    onFailure(e);
  }
};
