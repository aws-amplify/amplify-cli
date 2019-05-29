const pathManager = require('./path-manager');
const { readJsonFile } = require('./read-json-file');


function getProjectMeta() {
  const amplifyMetaFilePath = pathManager.getAmplifyMetaFilePath();
  const amplifyMeta = readJsonFile(amplifyMetaFilePath);
  return amplifyMeta;
}

module.exports = {
  getProjectMeta,
};
