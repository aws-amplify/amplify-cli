const inquirer = require('inquirer');
const sequential = require('promise-sequential');
const { getProviderPlugins } = require('../../extensions/amplify-helpers/get-provider-plugins');
const { normalizeProviderName } = require('../input-params-manager');

async function run(context) {
  const providerPlugins = getProviderPlugins(context);
  const providers = await getProviders(context, providerPlugins);
  context.exeInfo.projectConfig.providers = providers;
  const initializationTasks = [];

  providers.forEach((provider) => {
    const providerModule = require(providerPlugins[provider]);
    initializationTasks.push(() => providerModule.init(context));
  });

  await sequential(initializationTasks);

  return context;
}


async function getProviders(context, providerPlugins) {
  let providers = [];
  const providerPluginList = Object.keys(providerPlugins);
  const { inputParams } = context.exeInfo;
  if (inputParams && inputParams.amplify && inputParams.amplify.providers) {
    inputParams.amplify.providers.forEach((provider) => {
      provider = normalizeProviderName(provider, providerPluginList);
      if (provider) {
        providers.push(provider);
      }
    });
  }

  if (providers.length === 0) {
    if ((inputParams && inputParams.yes) || providerPluginList.length === 1) {
      context.print.info(`Using default provider  ${providerPluginList[0]}`);
      providers.push(providerPluginList[0]);
    } else {
      const selectProviders = {
        type: 'checkbox',
        name: 'selectedProviders',
        message: 'Select the backend providers.',
        choices: providerPluginList,
        default: providerPluginList[0],
      };
      const answer = await inquirer.prompt(selectProviders);
      providers = answer.selectedProviders;
    }
  }
  return providers;
}

module.exports = {
  run,
};
