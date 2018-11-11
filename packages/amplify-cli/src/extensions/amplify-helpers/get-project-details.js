const fs = require('fs-extra');
const pathManager = require('./path-manager');

function getProjectDetails() {
  const projectConfigFilePath = pathManager.getProjectConfigFilePath();
  const projectConfig = JSON.parse(fs.readFileSync(projectConfigFilePath));

  let amplifyMeta = {};
  const amplifyMetaFilePath = pathManager.getAmplifyMetaFilePath();
  if (fs.existsSync(amplifyMetaFilePath)) {
    amplifyMeta = JSON.parse(fs.readFileSync(amplifyMetaFilePath));
  }

  const envFilepath = pathManager.getLocalEnvFilePath();
  const localEnvInfo = JSON.parse(fs.readFileSync(envFilepath));

  let teamProviderInfo = {};
  const teamProviderFilePath = pathManager.getProviderInfoFilePath();
  if (fs.existsSync(teamProviderFilePath)) {
    teamProviderInfo = JSON.parse(fs.readFileSync(teamProviderFilePath));
  }

  return {
    projectConfig,
    amplifyMeta,
    localEnvInfo,
    teamProviderInfo,
  };
}

module.exports = {
  getProjectDetails,
};
