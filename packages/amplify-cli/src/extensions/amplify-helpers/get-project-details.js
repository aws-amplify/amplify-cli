const fs = require('fs-extra');
const pathManager = require('./path-manager');
const { getEnvInfo } = require('./get-env-info');
const { readJsonFile } = require('./read-json-file');

function getProjectDetails() {
  const projectConfigFilePath = pathManager.getProjectConfigFilePath();
  const projectConfig = readJsonFile(projectConfigFilePath);

  let amplifyMeta = {};
  const amplifyMetaFilePath = pathManager.getAmplifyMetaFilePath();
  if (fs.existsSync(amplifyMetaFilePath)) {
    amplifyMeta = readJsonFile(amplifyMetaFilePath);
  }

  const localEnvInfo = getEnvInfo();

  let teamProviderInfo = {};
  const teamProviderFilePath = pathManager.getProviderInfoFilePath();
  if (fs.existsSync(teamProviderFilePath)) {
    teamProviderInfo = readJsonFile(teamProviderFilePath);
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
