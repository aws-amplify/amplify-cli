const fs = require('fs');
const pathManager = require('./path-manager');
const { readJsonFile } = require('./read-json-file');

function getEnvInfo() {
  const envFilePath = pathManager.getLocalEnvFilePath();
  let envInfo = {};
  if (fs.existsSync(envFilePath)) {
    envInfo = readJsonFile(envFilePath);
  }

  return envInfo;
}

module.exports = {
  getEnvInfo,
};
