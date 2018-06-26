const inquirer = require('inquirer');
const sequential = require('promise-sequential');
const { getProviderPlugins } = require('../../extensions/amplify-helpers/get-provider-plugins');

function run(context) {
  const providerPlugins = getProviderPlugins(context);
  const selectProviders = {
    type: 'checkbox',
    name: 'selectedProviders',
    message: 'Please select the backend providers.',
    choices: Object.keys(providerPlugins),
    default: ['amplify-provider-awscloudformation'],
  };
  return inquirer.prompt(selectProviders)
    .then((answers) => {
      context.initInfo.projectConfig.providers = {};
      answers.selectedProviders.forEach((providerKey) => {
        context.initInfo.projectConfig.providers[providerKey] =
                    providerPlugins[providerKey];
      });
    }).then(() => {
      const { providers } = context.initInfo.projectConfig;
      const initializationTasks = [];
      Object.keys(providers).forEach((providerKey) => {
        const provider = require(providers[providerKey]);
        initializationTasks.push(() => provider.init(context));
      });
      return sequential(initializationTasks)
        .then(() => context)
        .catch((err) => {
          throw err;
        });
    });
}

module.exports = {
  run,
};
