const { join, dirname } = require('path');

const getAndroidResDir = require('./getAndroidResDir');
const getFrontEndHandler = require('./getFrontEndHandler');

function getSchemaDownloadLocation(context) {
  let downloadDir;
  try {
    const androidResDir = getAndroidResDir(context);
    downloadDir = join(dirname(androidResDir), 'graphql');
  } catch (e) {
    const frontEnd = getFrontEndHandler(context);
    const outputPath = frontEnd === 'javascript' ? 'src' : '';
    downloadDir = join(outputPath, 'graphql');
  }
  return join(downloadDir, 'schema.json');
}

module.exports = getSchemaDownloadLocation;
