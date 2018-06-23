const inquirer = require('inquirer');
const { getProviderPlugins } = require('../../extensions/awsmobile-helpers/get-provider-plugins');

function run(context) {
    providerPlugins = getProviderPlugins(context); 
    const selectProviders = {
        type: 'checkbox',
        name: 'selectedProviders',
        message: 'Please select the backend providers that you want to initialize now.',
        choices: Object.keys(providerPlugins),
        default: ['awsmobile-provider-cloudformation'],
    };
    return inquirer.prompt(selectProviders)
        .then((answers) => {
            context.initInfo.projectConfig.providers = {}; 
            answers.selectedProviders.forEach(providerKey=>{
                context.initInfo.projectConfig.providers[providerKey] = 
                    providerPlugins[providerKey]; 
            });
        }).then(()=>{
            const providers = context.initInfo.projectConfig.providers; 
            const initializationTasks = [];
            Object.keys(providers).forEach((providerKey) => {
                const provider = require(providers[providerKey]);
                initializationTasks.push(provider.init(context));
            });
            return Promise.all(initializationTasks)
                .then(() => context)
                .catch((err) => {
                    throw err;
                });
        });
}

module.exports = {
  run,
};
