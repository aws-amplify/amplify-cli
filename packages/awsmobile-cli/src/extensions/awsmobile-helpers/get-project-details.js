var fs = require('fs');
var pathManager = require('./path-manager');

function getProjectDetails(category) {
	const projectConfigFilePath = pathManager.getProjectConfigFilePath();
	let projectConfig = JSON.parse(fs.readFileSync(projectConfigFilePath));
	
	const projectInfoFilePath = pathManager.getProjectInfoFilePath();
	let projectInfo = JSON.parse(fs.readFileSync(projectInfoFilePath));

	return {
		projectConfig,
		projectInfo
	};
}

module.exports = {
 	getProjectDetails
}