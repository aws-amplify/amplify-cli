const fs = require('fs-extra');
const pathManager = require('./path-manager');

function getAllEnvs() {
  let allEnvs = [];
  const teamProviderInfoFilepath = pathManager.getProviderInfoFilePath();
  if (fs.existsSync(teamProviderInfoFilepath)) {
    const envInfo = JSON.parse(fs.readFileSync(teamProviderInfoFilepath));
    allEnvs = Object.keys(envInfo);
  }

  return allEnvs;
}

module.exports = {
  getAllEnvs,
};
