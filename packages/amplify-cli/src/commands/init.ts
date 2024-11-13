import { $TSContext, AmplifyError, LocalEnvInfo, stateManager } from '@aws-amplify/amplify-cli-core';
import { constructInputParams } from '../amplify-service-helper';
import { Context } from '../domain/context';
import { raisePostEnvAddEvent } from '../execution-manager';
import { postInitSetup } from '../init-steps/postInitSetup';
import { getPreInitSetup } from '../init-steps/preInitSetup';
import { analyzeProject, analyzeProjectHeadless } from '../init-steps/s0-analyzeProject';
import { initFrontend } from '../init-steps/s1-initFrontend';
import { initProviders } from '../init-steps/s2-initProviders';
import { scaffoldProjectHeadless } from '../init-steps/s8-scaffoldHeadless';
import { onHeadlessSuccess, onSuccess } from '../init-steps/s9-onSuccess';
import { checkForNestedProject } from './helpers/projectUtils';
import { getAmplifyAppId } from '../extensions/amplify-helpers/get-amplify-appId';

const constructExeInfo = (context: $TSContext): void => {
  context.exeInfo = {
    inputParams: constructInputParams(context),
    localEnvInfo: {} as unknown as LocalEnvInfo,
  };
};

const recommendGen2 = true;
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const runStrategy = (quickstart: boolean) =>
  quickstart
    ? [getPreInitSetup(!recommendGen2), analyzeProjectHeadless, scaffoldProjectHeadless, onHeadlessSuccess]
    : [getPreInitSetup(recommendGen2), analyzeProject, initFrontend, initProviders, onSuccess, postInitSetup];

/**
 * entry point for the init command
 */
export const run = async (context: $TSContext): Promise<void> => {
  constructExeInfo(context);
  checkForNestedProject();

  // Opt-out mechanism for customers that are using old app backend environments with existing apps intentionally
  const { AMPLIFY_SKIP_APP_ID_MISMATCH_CHECK } = process.env;
  if (AMPLIFY_SKIP_APP_ID_MISMATCH_CHECK !== 'true') {
    // check for appId mismatch
    const projectPath = process.cwd();
    if (stateManager.metaFileExists(projectPath)) {
      const inputAppId = context.exeInfo?.inputParams?.amplify?.appId;
      const appId = getAmplifyAppId();
      if (inputAppId && appId && inputAppId !== appId) {
        throw new AmplifyError('InvalidAmplifyAppIdError', {
          message: `Amplify appId mismatch.`,
          resolution: `You are currently working in the amplify project with Id ${appId}. If this is intentional, you may bypass this protection by setting the environment variable AMPLIFY_SKIP_APP_ID_MISMATCH_CHECK to true.`,
        });
      }
    }
  }

  const steps = runStrategy(!!context?.parameters?.options?.quickstart);
  for (const step of steps) {
    await step(context);
  }

  if (context.exeInfo.sourceEnvName && context.exeInfo.localEnvInfo.envName) {
    await raisePostEnvAddEvent(context as unknown as Context, context.exeInfo.sourceEnvName, context.exeInfo.localEnvInfo.envName);
  }
};
