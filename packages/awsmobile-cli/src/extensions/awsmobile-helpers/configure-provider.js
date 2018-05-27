var fs = require('fs');
var pathManager = require('./path-manager');
var inquirer = require('inquirer');

function configureProvider(context) {
	const projectConfigFilePath = pathManager.getProjectConfigFilePath();
	let projectConfig = JSON.parse(fs.readFileSync(projectConfigFilePath));
	let providers = projectConfig.providerPlugins;
	let pluginsInCheckBoxFormat = []
	Object.keys(providers).forEach((provider) => {
		pluginsInCheckBoxFormat.push({
			"name": providers[provider].name,
			"value": provider
		});
	});
	if(pluginsInCheckBoxFormat.length == 1) {
		return new Promise((resolve, reject) => {
			resolve({
				"providers" : [pluginsInCheckBoxFormat[0].value]
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