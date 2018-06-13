const fs = require('fs');
const pathManager = require('./path-manager');
const inquirer = require('inquirer');

function configureProvider() {
  const pluginConfigFilePath = pathManager.getPluginConfigFilePath();
  const pluginConfig = JSON.parse(fs.readFileSync(pluginConfigFilePath));
  const providers = pluginConfig.providerPlugins;
  const pluginsInCheckBoxFormat = [];
  Object.keys(providers).forEach((provider) => {
    pluginsInCheckBoxFormat.push({
      name: providers[provider].name,
      value: provider,
    });
  });
  if (pluginsInCheckBoxFormat.length === 1) {
    return new Promise((resolve) => {
      resolve({
        providers: [pluginsInCheckBoxFormat[0].value],
      });
    });
  }

  const optionsQuestion = {
    type: 'checkbox',
    name: 'providers',
    message: 'Which provider-implementation plugin you want to use for this resource.',
    choices: pluginsInCheckBoxFormat,
  };

  return inquirer.prompt(optionsQuestion);
}

module.exports = {
  configureProvider,
};
