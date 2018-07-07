const inquirer = require('inquirer');
const sequential = require('promise-sequential');
const { getProviderPlugins } = require('../../extensions/amplify-helpers/get-provider-plugins');

function run(context) {
  const providerPlugins = getProviderPlugins(context);
  const currentSelectedProviders = context.exeInfo.projectConfig['providers'];

  const providerSelection = {
    type: 'checkbox',
    name: 'selectedProviders',
    message: 'Please select the backend providers.',
    choices: providerPlugins,
    default: currentSelectedProviders,
  };

  const selectProviders = providerPluginList.length === 1 ?
    Promise.resolve({ selectedProviders: providerPluginList }) :
    inquirer.prompt(providerSelection);

  if (providerPluginList.length === 1) {
    context.print.info(`Using default provider ${providerPluginList[0]}`);
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
        Object.keys(answers.selectedProviders).forEach((providerKey) => {
            const provider = require(providers[providerKey]);
            if(currentSelectedProviders.hasOwnProperty(providerKey)){
                configTasks.push(() => provider.configure(context));
            }else{
                initializationTasks.push(() => provider.init(context));
                onInitSuccessfulTasks.push(() => provider.onInitSuccessful(context)); 
            }
        });
        return sequential(configTasks)
            .sequential(initializationTasks)
            .sequential(onInitSuccessfulTasks)
            .then(() => context)
            .catch((err) => {
                throw err;
            });
    });
}

module.exports = {
  run,
};
