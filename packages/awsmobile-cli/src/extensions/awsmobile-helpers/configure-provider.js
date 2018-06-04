var fs = require('fs');
var pathManager = require('./path-manager');
var inquirer = require('inquirer');

function configureProvider(context) {
    const pluginConfigFilePath = pathManager.getPluginConfigFilePath();
    let pluginConfig = JSON.parse(fs.readFileSync(pluginConfigFilePath));
    let providers = pluginConfig.providerPlugins;
    let pluginsInCheckBoxFormat = []
    Object.keys(providers).forEach((provider) => {
        pluginsInCheckBoxFormat.push({
            "name": providers[provider].name,
            "value": provider
        });
    });
    if (pluginsInCheckBoxFormat.length == 1) {
        return new Promise((resolve, reject) => {
            resolve({
                "providers": [pluginsInCheckBoxFormat[0].value]
            });
        })
    }

    var optionsQuestion = {
        type: 'checkbox',
        name: 'providers',
        message: 'Which provider-implementation plugin you want to use for this resource.',
        choices: pluginsInCheckBoxFormat
    };

    return inquirer.prompt(optionsQuestion);
}

module.exports = {
    configureProvider
};