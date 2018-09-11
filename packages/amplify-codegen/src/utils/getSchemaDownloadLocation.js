const { join, dirname } = require('path');

const getAndroidResDir = require('./getAndroidResDir');

function getSchemaDownloadLocation(context, name) {
  const { amplify } = context;
  let downloadDir;
  try {
    const androidResDir = getAndroidResDir(context);
    downloadDir = join(dirname(androidResDir), 'graphql');
  } catch (e) {
    const outputPath = amplify.pathManager.getBackendDirPath();
    downloadDir = join(outputPath, 'api', name);
  }
  return join(downloadDir, 'schema.json');
}

module.exports = getSchemaDownloadLocation;
