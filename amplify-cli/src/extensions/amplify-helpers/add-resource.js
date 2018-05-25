var fs = require('fs');
var pathManager = require('./path-manager');
var getProviderPlugins = require('./get-provider-plugins').getPlugins

function addResource(context, category) {
	const {print} = context;
	let providerPlugins = getProviderPlugins(category);
	return executePluginEvents(context, category, providerPlugins) 
}

function executePluginEvents(context, category, providerPlugins) {
	let promises = [];
	for(let i = 0; i < providerPlugins.length; i++) {
		let pluginPath = providerPlugins[i].path || providerPlugins[i].package;
		let pluginModule = require(pluginPath);

		promises.push(pluginModule.addResource(context, category));
	}
	return Promise.all(promises);
}

module.exports = {
    addResource
}