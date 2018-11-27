function getProjectMeta() {
  const fs = require('fs');
  const pathManager = require('./path-manager');
  const amplifyMetaFilePath = pathManager.getAmplifyMetaFilePath();
  const amplifyMeta = JSON.parse(fs.readFileSync(amplifyMetaFilePath));
  return amplifyMeta;
}

module.exports = {
  getProjectMeta,
};
