var fs = require('fs');
var inquirer = require('inquirer');
var pathManager = require('./path-manager');
var getProviderPlugins = require('./get-provider-plugins').getPlugins

var allServices = [];

function serviceSelectionPrompt(context, category, supportedServices) {
    let providerPlugins = getProviderPlugins();
    supportedServices = filterServicesByEnabledProviders(providerPlugins, supportedServices);

    return serviceQuestionWalkthrough(context, supportedServices, category);
}

function filterServicesByEnabledProviders(providerPlugins, supportedServices) {
    let filteredServices = [];

    Object.keys(supportedServices).forEach((service) => {
        let provider = providerPlugins.find((provider) => provider.plugin === supportedServices[service].provider);
        if (provider !== undefined) {
            filteredServices.push({
                service,
                provider
            });
        }
    });

    return filteredServices;

}

function serviceQuestionWalkthrough(context, supportedServices, category) {
    let options = [];

    for (let i = 0; i < supportedServices.length; i++) {
        options.push({
            "name": supportedServices[i].provider.name + ':' + supportedServices[i].service,
            "value": {
                provider: supportedServices[i].provider.plugin,
                service: supportedServices[i].service,
                providerName: supportedServices[i].provider.name
            }
        });
    }

    if (options.length === 0) {
        context.print.error('No services defined by configured providers for category: ' + category);
        process.exit(1);
    }
    if (options.length === 1) {
        // No need to ask questions
        context.print.info('Using service: ' + options[0].value.service + ', provided by: ' + options[0].value.providerName);
        return new Promise((resolve, reject) => {
            resolve(options[0].value);
        });
    }

    let question = [{
        name: 'service',
        message: "Please select from one of the above mentioned services",
        type: 'list',
        choices: options
    }];

    return inquirer.prompt(question)
        .then((answer) => answer.service);

}

module.exports = {
    serviceSelectionPrompt
}