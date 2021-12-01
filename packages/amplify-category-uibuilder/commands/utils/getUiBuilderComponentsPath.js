const path = require('path');
const fs = require('fs-extra');
const { extractArgs } = require('./extractArgs');

const getUiBuilderComponentsPath = context => {
  const args = extractArgs(context);
  const srcDir = args.srcDir ? args.srcDir : context.exeInfo.projectConfig.javascript.config.SourceDir;
  const uiBuilderComponentsPath = path.resolve(path.join('.', srcDir, 'ui-components'));

  if (!fs.existsSync(uiBuilderComponentsPath)) {
    fs.mkdirpSync(uiBuilderComponentsPath);
  }

  return uiBuilderComponentsPath;
};

module.exports = {
  getUiBuilderComponentsPath,
};
