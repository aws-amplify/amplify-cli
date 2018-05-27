var fs = require('fs');
var pathManager = require('./path-manager');
var getProviderPlugin = require('./get-provider-plugin').getPlugin

function addResource(context, category) {
	const {print} = context;
	let providerPlugin = getProviderPlugin(category);
	return executePluginEvent(context, category, providerPlugin) 
}

function executePluginEvent(context, category, providerPlugin) {
	
	let pluginPath = providerPlugin.path || providerPlugin.package;
	let pluginModule = require(pluginPath);

	pluginModule.addResource(context, category);

}

module.exports = {
    addResource
}