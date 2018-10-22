const inquirer = require('inquirer');
const sequential = require('promise-sequential');
const { getProviderPlugins } = require('../../extensions/amplify-helpers/get-provider-plugins');

async function run(context) {
  const providerPlugins = getProviderPlugins(context);

  const providers = await getProviders(context, providerPlugins);

  context.exeInfo.projectConfig.providers = providers;

  const initializationTasks = [];
  providers.forEach((provider) => {
    const providerModule = require(providerPlugins[provider]);
    initializationTasks.push(() => providerModule.init(context));
  });
  return sequential(initializationTasks)
    .then(() => context)
    .catch((err) => {
      throw err;
    });
}


async function getProviders(context, providerPlugins) {
  let providers = [];
  if (context.exeInfo.inputParams.amplify && context.exeInfo.inputParams.amplify.providers) {
    context.exeInfo.inputParams.amplify.providers.forEach((p) => {
      const providerName = normalizeProviderName(p, providerPlugins);
      if (providerName) {
        providers.push(providerName);
      }
    });
  }

  if (providers.length === 0) {
    const providerPluginList = Object.keys(providerPlugins);
    if (context.exeInfo.inputParams.yes || providerPluginList.length === 1) {
      context.print.info(`Using default provider ${providerPluginList[0]}`);
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

function normalizeProviderName(name, providerPlugins) {
  const nameSplit = name.split('-');
  name = nameSplit[nameSplit.length - 1];
  name = Object.keys(providerPlugins).includes(name) ? name : undefined;
  return name;
}

module.exports = {
  run,
};
