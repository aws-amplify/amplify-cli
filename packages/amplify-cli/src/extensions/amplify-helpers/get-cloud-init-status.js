const fs = require('fs-extra');
const pathManager = require('./path-manager');

const CLOUD_INITIALIZED = 'CLOUD_INITIALIZED';
const CLOUD_NOT_INITIALIZED = 'CLOUD_NOT_INITIALIZED';
const NON_AMPLIFY_PROJECT = 'NON_AMPLIFY_PROJECT';
function getCloudInitStatus() {
  const amplifyMetaPath = pathManager.getAmplifyMetaFilePath();
  const backendConfigPath = pathManager.getBackendConfigFilePath();

  if (fs.existsSync(amplifyMetaPath)) {
    return CLOUD_INITIALIZED;
  }
  if (fs.existsSync(backendConfigPath)) {
    return CLOUD_NOT_INITIALIZED;
  }
  return NON_AMPLIFY_PROJECT;
}

module.exports = {
  getCloudInitStatus,
  NON_AMPLIFY_PROJECT,
  CLOUD_INITIALIZED,
  CLOUD_NOT_INITIALIZED,
};
