var fs = require('fs');
var inquirer = require('inquirer');
var pathManager = require('./path-manager');
var getProviderPlugins = require('./get-provider-plugins').getPlugins

var allServices = [];

function serviceSelectionPrompt(context, category) {
	const {print} = context;
	let providerPlugins = getProviderPlugins();
	return getAllProviderEnabledServices(context, category, providerPlugins) 
		.then((services) => serviceQuestionWalkthrough(context, services, providerPlugins, category))
}

function getAllProviderEnabledServices(context, category, providerPlugins) {
	let promises = [];
	for(let i = 0; i < providerPlugins.length; i++) {
		let pluginPath = providerPlugins[i].path || providerPlugins[i].package;
		let pluginModule = require(pluginPath);
		promises.push(pluginModule.getServices(context, category));
	}
	return Promise.all(promises);
}

function serviceQuestionWalkthrough(context, services, providerPlugins, category) {
	let options = [];

	for(let i = 0; i < providerPlugins.length; i++) {
		let supportedServices = services[i];
		for(let j = 0; j < supportedServices.length; j++) {
			options.push({
				"name": providerPlugins[i].name + ':' + supportedServices[j],
				"value": {
					provider: providerPlugins[i].plugin,
					service: supportedServices[j],
					providerName: providerPlugins[i].name
				}
			});
		}
	}
	if(options.length === 0) {
		context.print.error('No services defined by configured providers for category: ' + category);
		process.exit(1);
	}
	if(options.length === 1) {
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