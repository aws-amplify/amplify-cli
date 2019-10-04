const inquirer = require('inquirer');
const sequential = require('promise-sequential');
const { getProviderPlugins } = require('../extensions/amplify-helpers/get-provider-plugins');

function run(context) {
  const providerPlugins = getProviderPlugins(context);
  const providerPluginNames = Object.keys(providerPlugins);

  const providerSelection = {
    type: 'checkbox',
    name: 'selectedProviders',
    message: 'Select the backend providers.',
    choices: providerPluginNames,
  };

  const selectProviders =
    providerPluginNames.length === 1 ? Promise.resolve({ selectedProviders: providerPluginNames }) : inquirer.prompt(providerSelection);

  return selectProviders.then(answers => {
    const configTasks = [];

    answers.selectedProviders.forEach(providerKey => {
      const provider = require(providerPlugins[providerKey]);
      configTasks.push(() => provider.configureNewUser(context));
    });
    return sequential(configTasks).catch(err => {
      throw err;
    });
  });
}

module.exports = {
  run,
};
