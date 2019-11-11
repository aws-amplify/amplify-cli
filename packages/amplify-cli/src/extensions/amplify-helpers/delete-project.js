const ora = require('ora');
const pathManager = require('./path-manager');
const { removeEnvFromCloud } = require('./remove-env-from-cloud');
const { getFrontendPlugins } = require('./get-frontend-plugins');

async function deleteProject(context) {
  const confirmation = await getConfirmation(context);
  if (confirmation.proceed) {
    const allEnvs = context.amplify.getEnvDetails();
    const spinner = ora('Deleting resources from the cloud. This may take a few minutes...');
    spinner.start();
    await Promise.all(Object.keys(allEnvs).map(env => removeEnvFromCloud(context, env, confirmation.deleteS3)));
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

async function getConfirmation(context) {
  if (context.input.options && context.input.options.force)
    return {
      proceed: true,
      deleteS3: true,
    };

  return {
    proceed: await context.amplify.confirmPrompt.run(
      'Are you sure you want to continue? (This would delete all the environments of the project from the cloud and wipe out all the local amplify resource files)'
    ),
    // Place holder for later selective deletes
    deleteS3: true,
  };
}

module.exports = {
  deleteProject,
  getConfirmation,
};
