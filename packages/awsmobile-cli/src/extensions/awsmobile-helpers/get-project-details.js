const fs = require('fs');
const pathManager = require('./path-manager');

function getProjectDetails() {
  const projectConfigFilePath = pathManager.getProjectConfigFilePath();
  const projectConfig = JSON.parse(fs.readFileSync(projectConfigFilePath));

  const awsmobileMetaFilePath = pathManager.getAwsmobileMetaFilePath();
  const awsmobileMeta = JSON.parse(fs.readFileSync(awsmobileMetaFilePath));

  return {
    projectConfig,
    awsmobileMeta,
  };
}

module.exports = {
  getProjectDetails,
};
