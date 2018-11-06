const fs = require('fs');
const pathManager = require('./path-manager');

function getProjectDetails() {
  const projectConfigFilePath = pathManager.getProjectConfigFilePath();
  const projectConfig = JSON.parse(fs.readFileSync(projectConfigFilePath));

  const amplifyMetaFilePath = pathManager.getAmplifyMetaFilePath();
  const amplifyMeta = JSON.parse(fs.readFileSync(amplifyMetaFilePath));

  const envFilepath = pathManager.getLocalEnvFilePath();
  const localEnvInfo = JSON.parse(fs.readFileSync(envFilepath));

  return {
    projectConfig,
    amplifyMeta,
    localEnvInfo,
  };
}

module.exports = {
  getProjectDetails,
};
