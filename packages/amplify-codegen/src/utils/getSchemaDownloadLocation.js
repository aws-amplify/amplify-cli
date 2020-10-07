const path = require('path');

const getAndroidResDir = require('./getAndroidResDir');
const getFrontEndHandler = require('./getFrontEndHandler');

function getSchemaDownloadLocation(context) {
  let downloadDir;
  try {
    const androidResDir = getAndroidResDir(context);
    downloadDir = path.join(path.dirname(androidResDir), 'graphql');
  } catch (e) {
    const projectConfig = context.amplify.getProjectConfig();
    const sourceDir =
      projectConfig.javascript && projectConfig.javascript.config && projectConfig.javascript.config.SourceDir
        ? path.normalize(projectConfig.javascript.config.SourceDir)
        : 'src';
    const frontEnd = getFrontEndHandler(context);
    const outputPath = frontEnd === 'javascript' ? sourceDir : '';
    downloadDir = path.join(outputPath, 'graphql');
  }
  return path.join(downloadDir, 'schema.json');
}

module.exports = getSchemaDownloadLocation;
