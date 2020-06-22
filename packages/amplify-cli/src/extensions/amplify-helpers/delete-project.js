const ora = require('ora');
const pathManager = require('./path-manager');
const { removeEnvFromCloud } = require('./remove-env-from-cloud');
const { getFrontendPlugins } = require('./get-frontend-plugins');
const { getPluginInstance } = require('./get-plugin-instance');
const { getAmplifyAppId } = require('./get-amplify-appId');
async function deleteProject(context) {
  const confirmation = await getConfirmation(context);
  if (confirmation.proceed) {
    const allEnvs = context.amplify.getEnvDetails();
    const spinner = ora('Deleting resources from the cloud. This may take a few minutes...');

    try {
      spinner.start();
      await Promise.all(Object.keys(allEnvs).map(env => removeEnvFromCloud(context, env, confirmation.deleteS3)));
      const appId = getAmplifyAppId();
      if (confirmation.deleteAmpilfyApp && appId) {
        const awsCloudPlugin = getPluginInstance(context, 'awscloudformation');
        const amplifyClient = await awsCloudPlugin.getConfiguredAmplifyClient(context, {});
        const environments = await amplifyBackendEnvironments(amplifyClient, appId);
        if (environments.length === 0) {
          await amplifyClient.deleteApp({ appId }).promise();
        } else {
          context.print.warning('Amplify App cannot be deleted, other environments still linked to Application');
        }
      }
    } catch (ex) {
      spinner.fail('Project delete failed');
      throw ex;
    }
    spinner.succeed('Project deleted in the cloud');
    // Remove amplify dir
    const { frontend } = context.amplify.getProjectConfig();
    const frontendPlugins = getFrontendPlugins(context);
    const frontendPluginModule = require(frontendPlugins[frontend]);
    frontendPluginModule.deleteConfig(context);
    context.filesystem.remove(pathManager.getAmplifyDirPath());
    context.print.success('Project deleted locally.');
  }
}

async function amplifyBackendEnvironments(client, appId) {
  const data = await client
    .listBackendEnvironments({
      appId,
    })
    .promise();
  return data.backendEnvironments;
}

async function getConfirmation(context, env) {
  if (context.input.options && context.input.options.force)
    return {
      proceed: true,
      deleteS3: true,
      deleteAmpilfyApp: true,
    };
  const environmentText = env ? `'${env}' environment` : 'all the environments';
  return {
    proceed: await context.amplify.confirmPrompt.run(
      `Are you sure you want to continue? This CANNOT be undone. (This would delete ${environmentText} of the project from the cloud${
        env ? '' : ' and wipe out all the local files created by Amplify CLI'
      })`,
      false,
    ),
    // Place holder for later selective deletes
    deleteS3: true,
    deleteAmpilfyApp: true,
  };
}

module.exports = {
  deleteProject,
  getConfirmation,
};
