const fs = require('fs');
const pathManager = require('./path-manager');

function getEnvDetails() {
  const envProviderFilepath = pathManager.getProviderInfoFilePath();
  const envProviderInfo = JSON.parse(fs.readFileSync(envProviderFilepath));

  return envProviderInfo;
}

module.exports = {
  getEnvDetails,
};
