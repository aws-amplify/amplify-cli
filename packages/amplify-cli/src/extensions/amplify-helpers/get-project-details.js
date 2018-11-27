function getProjectDetails() {
  const fs = require('fs');
  const pathManager = require('./path-manager');
  const projectConfigFilePath = pathManager.getProjectConfigFilePath();
  const projectConfig = JSON.parse(fs.readFileSync(projectConfigFilePath));

  const amplifyMetaFilePath = pathManager.getAmplifyMetaFilePath();
  const amplifyMeta = JSON.parse(fs.readFileSync(amplifyMetaFilePath));

  return {
    projectConfig,
    amplifyMeta,
  };
}

module.exports = {
  getProjectDetails,
};
