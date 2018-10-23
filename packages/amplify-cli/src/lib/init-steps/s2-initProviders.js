const inquirer = require('inquirer');
const sequential = require('promise-sequential');
const { getProviderPlugins } = require('../../extensions/amplify-helpers/get-provider-plugins');

function run(context) {
  if (!context.exeInfo.isNewEnv) {
    return context;
  }
  const providerPlugins = getProviderPlugins(context);
  const providerPluginList = Object.keys(providerPlugins);

  const selectProviders = {
    type: 'checkbox',
    name: 'selectedProviders',
    message: 'Select the backend providers.',
    choices: providerPluginList,
    default: ['awscloudformation'],
  };

  const providerQuestion = providerPluginList.length === 1 ?
    Promise.resolve({ selectedProviders: providerPluginList }) :
    inquirer.prompt(selectProviders);

  if (providerPluginList.length === 1) {
    context.print.info(`Using default provider ${providerPluginList[0]}`);
  }

  return providerQuestion
    .then((answers) => {
      context.exeInfo.projectConfig.providers = {};
      answers.selectedProviders.forEach((providerKey) => {
        context.exeInfo.projectConfig.providers[providerKey] =
                    providerPlugins[providerKey];
      });
    }).then(() => {
      const { providers } = context.exeInfo.projectConfig;
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
