var fs = require('fs');
var pathManager = require('./path-manager')

function getPlugin(category) {
	let providerDetailsList = [];
	const pluginConfigFilePath = pathManager.getProjectConfigFilePath();
	let projectConfig = JSON.parse(fs.readFileSync(pluginConfigFilePath));
	let providerPlugin = projectConfig.defaultProvider;
	
	return projectConfig.providerPlugins[providerPlugin];
}

module.exports = {
 	getPlugin
}