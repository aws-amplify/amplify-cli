var fs = require('fs');
var pathManager = require('./path-manager')

function getPlugins() {
	let providerDetailsList = [];
	const pluginConfigFilePath = pathManager.getPluginConfigFilePath();
	let pluginConfig = JSON.parse(fs.readFileSync(pluginConfigFilePath));
	let providerPlugins = pluginConfig.defaultProviders;
	
	for(let i = 0; i < providerPlugins.length; i++) {
		let providerPluginDetail = pluginConfig.providerPlugins[providerPlugins[i]];
		providerPluginDetail.plugin = providerPlugins[i];
		providerDetailsList.push(providerPluginDetail);
	}
	return providerDetailsList;
}

module.exports = {
 	getPlugins
}