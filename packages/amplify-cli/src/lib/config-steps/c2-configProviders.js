const inquirer = require('inquirer');
const sequential = require('promise-sequential');
const { getProviderPlugins } = require('../../extensions/amplify-helpers/get-provider-plugins');

function run(context) {
  const providerPlugins = getProviderPlugins(context);
  const providerPluginNames = Object.keys(providerPlugins);
  const currentSelectedProviders = context.exeInfo.projectConfig.providers;

  const providerSelection = {
    type: 'checkbox',
    name: 'selectedProviders',
    message: 'Please select the backend providers.',
    choices: providerPluginNames,
    default: currentSelectedProviders,
  };

  const selectProviders = providerPluginNames.length === 1 ?
    Promise.resolve({ selectedProviders: providerPluginNames }) :
    inquirer.prompt(providerSelection);

  if (providerPluginNames.length === 1) {
    context.print.info(`Using default provider ${providerPluginNames[0]}`);
  }

  return selectProviders
    .then((answers) => {
      context.exeInfo.projectConfig.providers = {};
      answers.selectedProviders.forEach((providerKey) => {
        context.exeInfo.projectConfig.providers[providerKey] =
                        providerPlugins[providerKey];
      });

      const configTasks = [];
      const initializationTasks = [];
      const onInitSuccessfulTasks = [];
      answers.selectedProviders.forEach((providerKey) => {
        const provider = require(providerPlugins[providerKey]);
        if (currentSelectedProviders.hasOwnProperty(providerKey)) {
          configTasks.push(() => provider.configure(context));
        } else {
          initializationTasks.push(() => provider.init(context));
          onInitSuccessfulTasks.push(() => provider.onInitSuccessful(context));
        }
      });
      return sequential(configTasks)
        .then(sequential(initializationTasks))
        .then(sequential(onInitSuccessfulTasks))
        .then(() => context)
        .catch((err) => {
          throw err;
        });
    });
}

module.exports = {
  run,
};
