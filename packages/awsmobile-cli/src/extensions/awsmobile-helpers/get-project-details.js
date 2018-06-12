var fs = require('fs');
var pathManager = require('./path-manager');
const pluginProvider = require('./get-provider-plugins'); 

function getProjectDetails(category) {
	let projectConfigFilePath = pathManager.getProjectConfigFilePath();
	let projectConfig = JSON.parse(fs.readFileSync(projectConfigFilePath));
	let pluginConfig = pluginProvider.getPlugins(); 
	let awsmobileMetaFilePath = pathManager.getAwsmobileMetaFilePath();
    let awsmobileMeta = JSON.parse(fs.readFileSync(awsmobileMetaFilePath));

	return {
		projectConfig,
		pluginConfig,
		awsmobileMeta
	};
}

module.exports = {
 	getProjectDetails
}