const path = require('path');
const os = require('os');
const minimatch = require('minimatch');
const fs = require('fs-extra');

const constants = require('../../constants');

function getAmplifyIgnore(context) {
  let result = [];
  const { projectConfig } = context.exeInfo;
  const filePath = path.join(projectConfig.projectPath, constants.AmplifyIgnoreFileName);
  if (fs.existsSync(filePath)) {
    const fileContents = fs.readFileSync(filePath, 'utf8');
    result = fileContents.split(os.EOL)
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .filter(line => !/^#/.test(line));
  }
  return result;
}

function isIgnored(filePath, amplifyIgnore, ignoreRoot) {
  let result = false;
  if (amplifyIgnore.length > 0) {
    for (let i = 0; i < amplifyIgnore.length; i++) {
      let pattern = amplifyIgnore[i];
      if (/^\/.*/.test(pattern)) {
        pattern = path.normalize(path.join(ignoreRoot, pattern));
      }
      if (minimatch(filePath, pattern, { matchBase: true })) {
        result = true;
        break;
      }
    }
  }
  return result;
}

module.exports = {
  getAmplifyIgnore,
  isIgnored,
};
