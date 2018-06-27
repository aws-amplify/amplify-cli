const fs = require('fs');
const pathManager = require('./path-manager');

function getProjectMeta() {
  const amplifyMetaFilePath = pathManager.getAmplifyMetaFilePath();
  const amplifyMeta = JSON.parse(fs.readFileSync(amplifyMetaFilePath));
  return amplifyMeta;
}

module.exports = {
  getProjectMeta,
};
