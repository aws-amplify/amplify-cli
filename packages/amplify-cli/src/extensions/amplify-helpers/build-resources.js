const ora = require('ora');
const { getProviderPlugins } = require('./get-provider-plugins');

const spinner = ora('Building resources. This may take a few minutes...');

function buildResources(context, category, resourceName) {
  return context.amplify.confirmPrompt
    .run('Are you sure you want to continue building the resources?')
    .then(answer => {
      if (answer) {
        const providerPlugins = getProviderPlugins(context);
        const providerPromises = [];

        Object.keys(providerPlugins).forEach(provider => {
          const pluginModule = require(providerPlugins[provider]);
          providerPromises.push(pluginModule.buildResources(context, category, resourceName));
        });

        spinner.start();
        return Promise.all(providerPromises);
      }
    })
    .then(() => spinner.succeed('All resources are built.'))
    .catch(err => {
      console.log(err);
      spinner.fail('An error occurred when building the resources.');
      throw err;
    });
}

module.exports = {
  buildResources,
};
