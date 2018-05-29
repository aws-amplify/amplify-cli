var fs = require('fs');
var pathManager = require('./path-manager');
var getProviderPlugins = require('./get-provider-plugins').getPlugins;
var updateAwsmobileMeta = require('./update-awsmobile-meta').updateAwsmobileMeta

function addResource(context, providerPlugin, service, category) {
	const {print} = context;
	let providerPlugins = getProviderPlugins();
	let providerDetails = providerPlugins.find((item) => item.plugin === providerPlugin);
	if(!providerDetails) {
		print.error("Provider plugin not found: " + providerPlugin);
		process.exit(1);
	}
	let pluginPath = providerDetails.path || providerDetails.package;
	return executePluginEvent(context, pluginPath, service, category)
		.then((resourceName) => {
			let options = {
				service,
				providerPlugin
			};
			return updateAwsmobileMeta(category, resourceName, options);
		});
}

function executePluginEvent(context, pluginPath, service, category) {
	let pluginModule = require(pluginPath);
	return pluginModule.addResource(context, category, service);
}


module.exports = {
    addResource
}