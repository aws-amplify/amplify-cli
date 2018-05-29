var fs = require('fs');
var pathManager = require('./path-manager');

function getProjectDetails(category) {
	const projectConfigFilePath = pathManager.getProjectConfigFilePath();
	let projectConfig = JSON.parse(fs.readFileSync(projectConfigFilePath));
	
	const pluginConfigFilePath = pathManager.getPluginConfigFilePath();
	let pluginConfig = JSON.parse(fs.readFileSync(pluginConfigFilePath));

	return {
		projectConfig,
		pluginConfig
	};
}

module.exports = {
 	getProjectDetails
}