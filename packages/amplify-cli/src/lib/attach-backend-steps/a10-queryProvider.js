const inquirer = require('inquirer');
const { getProviderPlugins } = require('../../extensions/amplify-helpers/get-provider-plugins');
const { normalizeProviderName } = require('../input-params-manager');

async function run(context) {
  const providerPlugins = getProviderPlugins(context);
  const provider = await getProvider(context, providerPlugins);
  context.exeInfo.projectConfig.providers = [provider];

  const providerModule = require(providerPlugins[provider]);
  await providerModule.attachBackend(context);

  return context;
}

async function getProvider(context, providerPlugins) {
  let result;
  const providers = [];
  const providerPluginList = Object.keys(providerPlugins);

  if (providerPluginList.length === 0) {
    const errorMessage = 'Found no provider plugins';
    context.print.error(errorMessage);
    context.print.info("Run 'amplify plugin scan' to scan your system for provider plugins.");
    throw new Error(errorMessage);
  }

  const { inputParams } = context.exeInfo;
  if (inputParams && inputParams.amplify && inputParams.amplify.providers) {
    inputParams.amplify.providers.forEach(provider => {
      provider = normalizeProviderName(provider, providerPluginList);
      if (provider) {
        providers.push(provider);
      }
    });
  }

  if (providers.length === 0) {
    if ((inputParams && inputParams.yes) || providerPluginList.length === 1) {
      result = providerPluginList[0]; // eslint-disable-line
    } else {
      const selectProvider = {
        type: 'list',
        name: 'selectedProvider',
        message: 'Select the backend provider.',
        choices: providerPluginList,
        default: providerPluginList[0],
      };
      const answer = await inquirer.prompt(selectProvider);
      result = answer.selectedProvider;
    }
  } else if (providers.length === 1) {
    result = providers[0]; // eslint-disable-line
  } else {
    const selectProvider = {
      type: 'list',
      name: 'selectedProvider',
      message: 'Select the backend provider.',
      choices: providers,
      default: providers[0],
    };
    const answer = await inquirer.prompt(selectProvider);
    result = answer.selectedProvider;
  }

  return result;
}

module.exports = {
  run,
};
