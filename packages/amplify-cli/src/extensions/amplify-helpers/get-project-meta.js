const fs = require('fs-extra');
const pathManager = require('./path-manager');
const { readJsonFile } = require('./read-json-file');

function getProjectMeta() {
  const amplifyMetaFilePath = pathManager.getAmplifyMetaFilePath();

  if (!amplifyMetaFilePath || !fs.existsSync(amplifyMetaFilePath)) {
    const error = new Error(
      "You are not working inside a valid amplify project.\nUse 'amplify init' in the root of your app directory to initialize your project with Amplify",
    );

    error.name = 'NotInitialized';
    error.stack = undefined;

    throw error;
  }

  const amplifyMeta = readJsonFile(amplifyMetaFilePath);
  return amplifyMeta;
}

module.exports = {
  getProjectMeta,
};
