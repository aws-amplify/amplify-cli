const inquirer = require('inquirer');
const sequential = require('promise-sequential');
const { getProviderPlugins } = require('../../extensions/amplify-helpers/get-provider-plugins');

async function run(context) {
  const providerPlugins = getProviderPlugins(context);
  const { providers: currentProviders } = context.exeInfo.projectConfig;

  const selectedProviders = await configureProviders(context, providerPlugins, currentProviders);

  const configTasks = [];
  const initializationTasks = [];
  const onInitSuccessfulTasks = [];

  selectedProviders.forEach((provider) => {
    const providerModule = require(providerPlugins[provider]);
    if (currentProviders.includes(provider)) {
      configTasks.push(() => providerModule.configure(context));
    } else {
      initializationTasks.push(() => providerModule.init(context));
      onInitSuccessfulTasks.push(() => providerModule.onInitSuccessful(context));
    }
  });
  
  await sequential(configTasks);
  await sequential(initializationTasks);
  await sequential(onInitSuccessfulTasks);
  
  return context;
}

async function configureProviders(context, providerPlugins, currentProviders) {
  let selectedProviders = [];
  if (context.exeInfo.inputParams.amplify && context.exeInfo.inputParams.amplify.providers) {
    context.exeInfo.inputParams.amplify.providers.forEach((provider) => {
      provder = normalizeProviderName(provider, providerPlugins);
      if (provder) {
        selectedProviders.push(provder);
      }
    });
  }
  if (selectedProviders.length === 0) {
    const providerPluginList = Object.keys(providerPlugins);
    if (context.exeInfo.inputParams.yes || providerPluginList.length === 1) {
      context.print.info(`Using default provider ${providerPluginList[0]}`);
      selectedProviders.push(providerPluginList[0]);
    } else {
      const selectProviders = {
        type: 'checkbox',
        name: 'selectedProviders',
        message: 'Select the backend providers.',
        choices: providerPluginList,
        default: currentProviders,
      };
      const answer = await inquirer.prompt(selectProviders);
      selectedProviders = answer.selectedProviders;
    }
  }
  return selectedProviders;
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
