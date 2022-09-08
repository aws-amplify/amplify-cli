/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
import ora from 'ora';
import chalk from 'chalk';
import { FeatureFlags, $TSContext } from 'amplify-cli-core';
import { printer } from 'amplify-prompts';
import { removeEnvFromCloud } from './remove-env-from-cloud';
import { getFrontendPlugins } from './get-frontend-plugins';
import { getPluginInstance } from './get-plugin-instance';
import { getAmplifyAppId } from './get-amplify-appId';
import { getAmplifyDirPath } from './path-manager';

/**
 * Deletes the amplify project from the cloud and local machine
 */
export const deleteProject = async (context): Promise<void> => {
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
      await Promise.all(Object.keys(allEnvs).map(env => removeEnvFromCloud(context, env, confirmation.deleteS3)));
      const appId = getAmplifyAppId();
      if (confirmation.deleteAmplifyApp && appId) {
        const awsCloudPlugin = getPluginInstance(context, 'awscloudformation');
        const amplifyClient = await awsCloudPlugin.getConfiguredAmplifyClient(context, {});
        const environments = await amplifyBackendEnvironments(amplifyClient, appId);
        if (environments.length === 0) {
          await amplifyClient.deleteApp({ appId }).promise();
        } else {
          context.print.warning('Amplify App cannot be deleted, other environments still linked to Application');
        }
      }
      spinner.succeed('Project deleted in the cloud.');
    } catch (ex) {
      if ('name' in ex && ex.name === 'BucketNotFoundError') {
        spinner.succeed('Project already deleted in the cloud.');
      } else {
        spinner.fail('Project delete failed.');
        throw ex;
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
  const data = await client
    .listBackendEnvironments({
      appId,
    })
    .promise();
  return data.backendEnvironments;
};

/**
 * Get confirmation from the user to delete the project
 */
export const getConfirmation = async (context, env?) => {
  if (context.input.options && context.input.options.force) {
    return {
      proceed: true,
      deleteS3: true,
      deleteAmplifyApp: !process.env.CLI_DEV_INTERNAL_DISABLE_AMPLIFY_APP_DELETION,
    };
  }
  const environmentText = env ? `'${env}' environment` : 'all the environments';
  return {
    proceed: await context.amplify.confirmPrompt(
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
