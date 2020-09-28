import { pullBackend } from '../pull-backend';
import { preDeployPullBackend } from '../pre-deployment-pull';
import { attachBackend } from '../attach-backend';
import { constructInputParams } from '../amplify-service-helper';
import { run as envCheckout } from './env/checkout';
import { stateManager } from 'amplify-cli-core';

export const run = async context => {
  const inputParams = constructInputParams(context);
  const projectPath = process.cwd();

  if (inputParams.backendManagerAppId) {
    preDeployPullBackend(context, inputParams.backendManagerAppId);
    return;
  }

  if (stateManager.currentMetaFileExists(projectPath)) {
    const { appId: inputAppId, envName: inputEnvName } = inputParams.amplify;
    const teamProviderInfo = stateManager.getTeamProviderInfo(projectPath);
    const { envName } = stateManager.getLocalEnvInfo(projectPath);

    const { AmplifyAppId } = teamProviderInfo[envName].awscloudformation;
    const localEnvNames = Object.keys(teamProviderInfo);

    if (inputAppId && AmplifyAppId && inputAppId !== AmplifyAppId) {
      context.print.error('Amplify appId mismatch.');
      context.print.info(`You are currently working in the amplify project with Id ${AmplifyAppId}`);
      throw new Error('Amplify appId');
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
    await attachBackend(context, inputParams);
  }
};
