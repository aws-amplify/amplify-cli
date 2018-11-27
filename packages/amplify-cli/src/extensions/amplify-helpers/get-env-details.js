const fs = require('fs');
const pathManager = require('./path-manager');

function getEnvDetails() {
  const envProviderFilepath = pathManager.getProviderInfoFilePath();
  let envProviderInfo = {};
  if (fs.existsSync(envProviderFilepath)) {
    envProviderInfo = JSON.parse(fs.readFileSync(envProviderFilepath));
  }

  return envProviderInfo;
}

module.exports = {
  getEnvDetails,
};
