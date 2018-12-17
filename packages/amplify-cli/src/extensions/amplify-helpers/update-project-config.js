function updateProjectConfig(projectPath, label, data) {
  const fs = require('fs-extra');
  const pathManager = require('./path-manager');
  let projectConfig;
  const projectConfigFilePath = pathManager.getProjectConfigFilePath(projectPath);
  if (fs.existsSync(projectConfigFilePath)) {
    projectConfig = JSON.parse(fs.readFileSync(projectConfigFilePath));
  } else {
    projectConfig = {};
  }

  projectConfig[label] = data;

  const jsonString = JSON.stringify(projectConfig, null, 4);
  fs.writeFileSync(projectConfigFilePath, jsonString, 'utf8');
}

module.exports = {
  updateProjectConfig,
};
