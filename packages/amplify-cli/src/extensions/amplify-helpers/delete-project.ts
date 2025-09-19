/* eslint-disable import/no-dynamic-require */
/* eslint-disable global-require */
/* eslint-disable @typescript-eslint/no-var-requires */
import ora from 'ora';
import chalk from 'chalk';
import { ListBackendEnvironmentsCommand, DeleteAppCommand } from '@aws-sdk/client-amplify';
import { FeatureFlags, $TSContext, AmplifyFault } from '@aws-amplify/amplify-cli-core';
import { printer, prompter } from '@aws-amplify/amplify-prompts';
import { removeEnvFromCloud } from './remove-env-from-cloud';
import { getFrontendPlugins } from './get-frontend-plugins';
import { getPluginInstance } from './get-plugin-instance';
import { getAmplifyAppId } from './get-amplify-appId';
import { getAmplifyDirPath } from './path-manager';
import { invokeDeleteEnvParamsFromService } from '../../extensions/amplify-helpers/invoke-delete-env-params';

/**
 * Deletes the amplify project from the cloud and local machine
 */
export const deleteProject = async (context: $TSContext): Promise<void> => {
  const confirmation = await getConfirmation(context);

  if (confirmation.proceed) {
    const allEnvs = context.amplify.getEnvDetails();
    const envNames = Object.keys(allEnvs);

    if (FeatureFlags.isInitialized()) {
      await FeatureFlags.removeFeatureFlagConfiguration(true, envNames);
    }

    const spinner = ora('Deleting resources from the cloud. This will take a few minutes.');

    try {
      spinner.start();
      await Promise.all(Object.keys(allEnvs).map((env) => removeEnvFromCloud(context, env, confirmation.deleteS3)));
      const appId = getAmplifyAppId();
      if (confirmation.deleteAmplifyApp && appId) {
        const awsCloudPlugin = getPluginInstance(context, 'awscloudformation');
        const amplifyClient = await awsCloudPlugin.getConfiguredAmplifyClient(context, {});
        const environments = await amplifyBackendEnvironments(amplifyClient, appId);
        if (environments.length === 0) {
          await amplifyClient.send(new DeleteAppCommand({ appId }));
        } else {
          printer.warn('Amplify App cannot be deleted, other environments still linked to Application');
        }
      }

      // delete env parameters from service for each env
      await Promise.all(envNames.map((envName) => invokeDeleteEnvParamsFromService(context, envName)));

      spinner.succeed('Project deleted in the cloud.');
    } catch (ex) {
      if ('name' in ex && ex.name === 'BucketNotFoundError') {
        spinner.succeed('Project already deleted in the cloud.');
      } else {
        spinner.fail('Project delete failed.');
        throw new AmplifyFault(
          'BackendDeleteFault',
          {
            message: 'Project delete failed.',
            details: ex.message,
          },
          ex,
        );
      }
    }
    removeLocalAmplifyDir(context);
  }
};

const removeLocalAmplifyDir = (context: $TSContext): void => {
  const { frontend } = context.amplify.getProjectConfig();
  const frontendPlugins = getFrontendPlugins(context);
  const frontendPluginModule = require(frontendPlugins[frontend]);

  frontendPluginModule.deleteConfig(context);
  context.filesystem.remove(getAmplifyDirPath());
  printer.success('Project deleted locally.');
};

const amplifyBackendEnvironments = async (client, appId): Promise<string[]> => {
  const data = await client.send(new ListBackendEnvironmentsCommand({ appId }));
  return data.backendEnvironments;
};

/**
 * Get confirmation from the user to delete the project
 */
export const getConfirmation = async (
  context: $TSContext,
  env?: string,
): Promise<{ proceed: boolean; deleteS3: boolean; deleteAmplifyApp: boolean }> => {
  if (context.input.options && context.input.options.force) {
    return {
      proceed: true,
      deleteS3: true,
      deleteAmplifyApp: !process.env.CLI_DEV_INTERNAL_DISABLE_AMPLIFY_APP_DELETION,
    };
  }
  const environmentText = env ? `'${env}' environment` : 'all the environments';
  return {
    proceed: await prompter.yesOrNo(
      chalk.red(
        `Are you sure you want to continue? This CANNOT be undone. (This will delete ${environmentText} of the project from the cloud${
          env ? '' : ' and wipe out all the local files created by Amplify CLI'
        })`,
      ),
      false,
    ),
    // Placeholder for later selective deletes
    deleteS3: true,
    deleteAmplifyApp: true,
  };
};
