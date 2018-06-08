var fs = require('fs');
var pathManager = require('./path-manager');
const pluginProvider = require('./get-provider-plugins'); 

function getProjectDetails(category) {
	const projectConfigFilePath = pathManager.getProjectConfigFilePath();
	let projectConfig = JSON.parse(fs.readFileSync(projectConfigFilePath));
	
	let pluginConfig = pluginProvider.getPlugins(); 

	return {
		projectConfig,
		pluginConfig
	};
}

module.exports = {
 	getProjectDetails
}