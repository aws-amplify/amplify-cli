const fs = require('fs');
const pathManager = require('./path-manager');
const { readJsonFile } = require('./read-json-file');

function getEnvInfo() {
  const envFilePath = pathManager.getLocalEnvFilePath();
  let envInfo = {};
  if (fs.existsSync(envFilePath)) {
    envInfo = readJsonFile(envFilePath);
  } else {
    // EnvInfo is required by all the callers so we can safely throw here
    throw new Error('Current environment cannot be determined\nUse \'amplify init\' in the root of your app directory to initialize your project with Amplify');
  }

  return envInfo;
}

module.exports = {
  getEnvInfo,
};
