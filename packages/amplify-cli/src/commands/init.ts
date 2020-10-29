import { $TSContext } from 'amplify-cli-core';
import { preInitSetup } from '../init-steps/preInitSetup';
import { postInitSetup } from '../init-steps/postInitSetup';
import { analyzeProject } from '../init-steps/s0-analyzeProject';
import { initFrontend } from '../init-steps/s1-initFrontend';
import { initProviders } from '../init-steps/s2-initProviders';
import { onFailure } from '../init-steps/s9-onFailure';
import { onSuccess } from '../init-steps/s9-onSuccess';
import { constructInputParams } from '../amplify-service-helper';

function constructExeInfo(context: $TSContext) {
  context.exeInfo = {
    inputParams: constructInputParams(context),
  };
}

export const run = async (context: $TSContext) => {
  constructExeInfo(context);
  try {
    await preInitSetup(context);
    await analyzeProject(context);
    await initFrontend(context);
    await initProviders(context);
    await onSuccess(context);
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
