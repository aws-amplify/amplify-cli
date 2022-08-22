import {
  $TSContext, stateManager, EnvironmentDoesNotExistError, AppIdMismatchError,
} from 'amplify-cli-core';
import { pullBackend } from '../pull-backend';
import { preDeployPullBackend } from '../pre-deployment-pull';
import { attachBackend } from '../attach-backend';
import { constructInputParams } from '../amplify-service-helper';
import { run as envCheckout } from './env/checkout';
import { showTroubleshootingURL } from './help';
import { getAmplifyAppId } from '../extensions/amplify-helpers/get-amplify-appId';
import { checkForNestedProject } from './helpers/projectUtils';

/**
 * Entry point for pull command
 */
export const run = async (context: $TSContext): Promise<void> => {
  const inputParams = constructInputParams(context);
  const projectPath = process.cwd();

  if (inputParams.sandboxId) {
    try {
      await preDeployPullBackend(context, inputParams.sandboxId);
    } catch (e) {
      context.print.error(`Failed to pull sandbox app: ${e.message || 'An unknown error occurred.'}`);
      showTroubleshootingURL();
    }
    return;
  }

  if (stateManager.currentMetaFileExists(projectPath)) {
    const { appId: inputAppId, envName: inputEnvName } = inputParams.amplify;
    const { envName } = stateManager.getLocalEnvInfo(projectPath);

    const appId = getAmplifyAppId();

    const localEnvNames = Object.keys(stateManager.getLocalAWSInfo(undefined, { throwIfNotExist: false }) || {});

    if (inputAppId && appId && inputAppId !== appId) {
      context.print.error('Amplify appId mismatch.');
      context.print.info(`You are currently working in the amplify project with Id ${appId}`);
      await context.usageData.emitError(new AppIdMismatchError());
      showTroubleshootingURL();
      process.exit(1);
    } else if (!appId) {
      context.print.error(`Environment '${envName}' not found.`);
      context.print.info('Try running "amplify env add" to add a new environment.');
      context.print.info('If this backend already exists, try restoring its definition in your team-provider-info.json file.');
      await context.usageData.emitError(new EnvironmentDoesNotExistError());
      showTroubleshootingURL();
      process.exit(1);
    }

    if (inputEnvName) {
      if (inputEnvName === envName) {
        await pullBackend(context, inputParams);
      } else if (localEnvNames.includes(inputEnvName)) {
        context.parameters.options = {};
        context.parameters.first = inputEnvName;
        await envCheckout(context);
      } else {
        inputParams.amplify.appId = inputAppId;
        await attachBackend(context, inputParams);
      }
    } else {
      await pullBackend(context, inputParams);
    }
  } else {
    checkForNestedProject();
    await attachBackend(context, inputParams);
  }
};
