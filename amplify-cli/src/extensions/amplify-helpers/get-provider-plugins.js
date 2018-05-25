var fs = require('fs');
var pathManager = require('./path-manager')

function getPlugins(category) {
	let providerDetailsList = [];
	const pluginConfigFilePath = pathManager.getProjectConfigFilePath();
	let projectConfig = JSON.parse(fs.readFileSync(pluginConfigFilePath));
	let providerPlugins = projectConfig.category[category].providers;
	
	for(let i = 0; i < providerPlugins.length; i++) {
		let providerPluginDetail = projectConfig.providerPlugins[providerPlugins[i]];
		providerDetailsList.push(providerPluginDetail);
	}
	return providerDetailsList;
}

module.exports = {
 	getPlugins
}