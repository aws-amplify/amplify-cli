import { $TSContext, stateManager, AmplifyError, AmplifyFault } from '@aws-amplify/amplify-cli-core';
import { pullBackend } from '../pull-backend';
import { preDeployPullBackend } from '../pre-deployment-pull';
import { attachBackend } from '../attach-backend';
import { constructInputParams } from '../amplify-service-helper';
import { run as envCheckout } from './env/checkout';
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
      throw new AmplifyFault(
        'UnknownFault',
        {
          message: `Failed to pull sandbox app.`,
          details: e.message || 'An unknown error occurred.',
        },
        e,
      );
    }
    return;
  }

  if (stateManager.currentMetaFileExists(projectPath)) {
    const { appId: inputAppId, envName: inputEnvName } = inputParams.amplify;
    const { envName } = stateManager.getLocalEnvInfo(projectPath, { throwIfNotExist: false }) || {};

    const appId = getAmplifyAppId();

    const localEnvNames = Object.keys(stateManager.getLocalAWSInfo(undefined, { throwIfNotExist: false }) || {});

    if (inputAppId && appId && inputAppId !== appId) {
      throw new AmplifyError('InvalidAmplifyAppIdError', {
        message: `Amplify appId mismatch.`,
        resolution: `You are currently working in the amplify project with Id ${appId}`,
      });
    } else if (!appId) {
      throw new AmplifyError('EnvironmentNotInitializedError', {
        message: `Environment '${envName}' not found.`,
        resolution: `Try running "amplify env add" to add a new environment.\nIf this backend already exists, try restoring its definition in your team-provider-info.json file.`,
      });
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
