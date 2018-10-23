const fs = require('fs');
const pathManager = require('./path-manager');

function getEnvInfo() {
  const envFilepath = pathManager.getLocalEnvFilePath();
  const envInfo = JSON.parse(fs.readFileSync(envFilepath));

  return envInfo;
}

module.exports = {
  getEnvInfo,
};
