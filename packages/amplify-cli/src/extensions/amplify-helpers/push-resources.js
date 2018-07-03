const ora = require('ora');
const { getProviderPlugins } = require('./get-provider-plugins');
const { showResourceTable } = require('./resource-status');
const { onCategoryOutputsChange } = require('./on-category-outputs-change');

const spinner = ora('Updating resources in the cloud. This may take a few minutes...');

function pushResources(context, category, resourceName) {
  showResourceTable(category, resourceName);

  return context.prompt.confirm('Are you sure you want to continue?')
    .then((answer) => {
      if (answer) {
        const providerPlugins = getProviderPlugins(context);
        const providerPromises = [];

        Object.keys(providerPlugins).forEach((provider) => {
          const pluginModule = require(providerPlugins[provider]);
          providerPromises.push(pluginModule.pushResources(context, category, resourceName));
        });

        spinner.start();
        return Promise.all(providerPromises);
      }
      process.exit(1);
    })
    .then(() => {
      onCategoryOutputsChange(); 
      spinner.succeed('All resources are updated in the cloud'); 
    })
    .catch((err) => {
      console.log(err);
      spinner.fail('There was an issue pushing the resources to the cloud');
      throw err;
    });
}

module.exports = {
  pushResources,
};
