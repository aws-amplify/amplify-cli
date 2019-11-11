const ora = require('ora');
const pathManager = require('./path-manager');
const { removeEnvFromCloud } = require('./remove-env-from-cloud');

async function deleteProject(context) {
  if (
    await context.amplify.confirmPrompt.run(
      'Are you sure you want to continue? (This would delete all the environments of the project from the cloud and wipe out all the local amplify resource files)'
    )
  ) {
    const removeEnvPromises = [];
    const allEnvs = context.amplify.getEnvDetails();
    Object.keys(allEnvs).forEach(env => {
      removeEnvPromises.push(removeEnvFromCloud(context, env));
    });
    const spinner = ora('Deleting resources from the cloud. This may take a few minutes...');
    spinner.start();
    await Promise.all(removeEnvPromises);
    spinner.succeed('Project deleted in the cloud');
    // Remove amplify dir
    context.filesystem.remove(pathManager.getAmplifyDirPath());
    context.print.success('Project deleted locally.');
  }
}

module.exports = {
  deleteProject,
};
