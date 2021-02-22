const path = require('path');
const { pathManager } = require('amplify-cli-core');

const getAndroidResDir = require('./getAndroidResDir');
const getFrontEndHandler = require('./getFrontEndHandler');

function isSubDirectory(parent, pathToCheck) {
  const relative = path.relative(parent, pathToCheck);
  return relative && !relative.startsWith('..') && !path.isAbsolute(relative);
}
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

  const projectRoot = pathManager.findProjectRoot();
  // Downloaded schema should always be inside the project dir so the project is self contained
  downloadDir = isSubDirectory(projectRoot, path.resolve(downloadDir)) ? downloadDir : path.join(projectRoot, downloadDir);
  return path.join(downloadDir, 'schema.json');
}

module.exports = getSchemaDownloadLocation;
