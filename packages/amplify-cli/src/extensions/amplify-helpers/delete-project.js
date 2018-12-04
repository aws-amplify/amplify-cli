const ora = require('ora');
const { getProjectConfig } = require('./get-project-config');
const { getCategoryPlugins } = require('./get-category-plugins');
const pathManager = require('./path-manager');

const spinner = ora('Deleting resources from the cloud. This may take a few minutes...');

async function deleteProject(context) {
  return context.amplify.confirmPrompt.run('Are you sure you want to continue?(This would delete all the project from the cloud and wipe out all the local amplify resource files)')
    .then((answer) => {
      if (answer) {
        const { providers } = getProjectConfig();
        const providerPromises = [];

        Object.keys(providers).forEach((providerName) => {
          const pluginModule = require(providers[providerName]);
          providerPromises.push(pluginModule.deleteProject(context));
        });

        spinner.start();
        return Promise.all(providerPromises);
      }
      process.exit(0);
    })
    .then(() => {
      const categoryPlugins = getCategoryPlugins(context);
      if (categoryPlugins.notifications) {
        const notificationsModule = require(categoryPlugins.notifications);
        return notificationsModule.deletePinpointApp(context);
      }
    })
    .then(() => {
      // Remove resource directory from backend/
      context.filesystem.remove(pathManager.getAmplifyDirPath());
      spinner.succeed('Project deleted locally and in the cloud');
      // Remove amplify dir
    })
    .catch((err) => {
      spinner.fail('An error occurred when deleting the resources');
      console.log(err.stack);
      // Handle the errors and print them nicely for the user.
      context.print.error(`\n${err.message}`);
    });
}

module.exports = {
  deleteProject,
};
