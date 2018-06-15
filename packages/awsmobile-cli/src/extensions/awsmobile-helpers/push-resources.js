const ora = require('ora');
const { getProviderPlugins } = require('./get-provider-plugins');
const { showResourceTable } = require('./resource-status');

let spinner;

function pushResources(context, category, resourceName) {
  showResourceTable(category, resourceName);

  return context.prompt.confirm('Are you sure you want to continue?')
    .then((answer) => {
      if (answer) {
        const providerPlugins = getProviderPlugins();
        const providerPromises = [];

        Object.keys(providerPlugins).forEach((provider) => {
          const pluginModule = require(providerPlugins[provider]);
          providerPromises.push(pluginModule.pushResources(context, category, resourceName));
        });

        spinner = ora('Updating resources in the cloud. This may take a few minutes...').start();
        return Promise.all(providerPromises);
      }
      process.exit(1);
    })
    .then(() => spinner.succeed('All resources updated are updated in the cloud'))
    .catch((err) => {
      spinner.fail('There was an issue pushing the resources to the cloud');
      throw err;
    });
}

module.exports = {
  pushResources,
};
