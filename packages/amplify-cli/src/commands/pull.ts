import { pullBackend } from '../pull-backend';
import { preDeployPullBackend } from '../pre-deployment-pull';
import { attachBackend } from '../attach-backend';
import { constructInputParams } from '../amplify-service-helper';
import { run as envCheckout } from './env/checkout';
import { $TSContext, stateManager, EnvironmentDoesNotExistError, AppIdMismatchError } from 'amplify-cli-core';
import _ from 'lodash';

export const run = async (context: $TSContext) => {
  const inputParams = constructInputParams(context);
  const projectPath = process.cwd();

  if (inputParams.sandboxId) {
    try {
      await preDeployPullBackend(context, inputParams.sandboxId);
    } catch (e) {
      context.print.error(`Failed to pull sandbox app: ${e.message || 'An unknown error occurred.'}`);
    }
    return;
  }

  if (stateManager.currentMetaFileExists(projectPath)) {
    const { appId: inputAppId, envName: inputEnvName } = inputParams.amplify;
    const teamProviderInfo = stateManager.getTeamProviderInfo(projectPath);
    const { envName } = stateManager.getLocalEnvInfo(projectPath);

    const appId = _.get(teamProviderInfo, [envName, 'awscloudformation', 'AmplifyAppId'], false);

    const localEnvNames = Object.keys(teamProviderInfo);

    if (inputAppId && appId && inputAppId !== appId) {
      context.print.error('Amplify appId mismatch.');
      context.print.info(`You are currently working in the amplify project with Id ${appId}`);
      await context.usageData.emitError(new AppIdMismatchError());
      process.exit(1);
    } else if (!appId) {
      context.print.error(`Environment '${envName}' not found.`);
      context.print.info(`Try running "amplify env add" to add a new environment.`);
      context.print.info(`If this backend already exists, try restoring its definition in your team-provider-info.json file.`);
      await context.usageData.emitError(new EnvironmentDoesNotExistError());
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
    await attachBackend(context, inputParams);
  }
};
