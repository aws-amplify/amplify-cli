const fs = require('fs');
const pathManager = require('./path-manager');

function getEnvInfo() {
  const envFilepath = pathManager.getLocalEnvFilePath();
  let envInfo = {};
  if (fs.existsSync(envFilepath)) {
    envInfo = JSON.parse(fs.readFileSync(envFilepath));
  }

  return envInfo;
}

module.exports = {
  getEnvInfo,
};
