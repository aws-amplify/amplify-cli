/* Helpers */

function projectPathValidate(projectPath) {
  const fs = require('fs');
  let isGood = false;
  if (fs.existsSync(projectPath)) {
    const dotamplifyDirPath = getAmplifyDirPath(projectPath);
    const infoSubDirPath = getDotConfigDirPath(projectPath);

    isGood = fs.existsSync(dotamplifyDirPath) &&
      fs.existsSync(infoSubDirPath);
  }
  return isGood;
}

function searchProjectRootPath() {
  const path = require('path');

  let result;
  let currentPath = process.cwd();

  do {
    if (projectPathValidate(currentPath)) {
      result = currentPath;
      break;
    } else {
      const parentPath = path.dirname(currentPath);
      if (currentPath === parentPath) {
        break;
      } else {
        currentPath = parentPath;
      }
    }
    /* eslint-disable */
  } while (true); /* eslint-enable */

  return result;
}

function getHomeDotAmplifyDirPath() {
  const path = require('path');
  const homedir = require('os').homedir();
  const amplifyCLIConstants = require('./constants.js');
  return path.join(homedir, amplifyCLIConstants.DotAmplifyDirName);
}

// ///////////////////level 0
function getAmplifyDirPath(projectPath) {
  const path = require('path');
  const amplifyCLIConstants = require('./constants.js');
  if (!projectPath) {
    projectPath = searchProjectRootPath();
  }
  if (projectPath) {
    return path.normalize(path.join(
      projectPath,
      amplifyCLIConstants.AmplifyCLIDirName,
    ));
  }
  throw new Error('You are not working inside a valid amplify project.\nUse \'amplify init\' in the root of your app directory to initialize your project with Amplify');
}

// ///////////////////level 1
function getDotConfigDirPath(projectPath) {
  const path = require('path');
  const amplifyCLIConstants = require('./constants.js');
  return path.normalize(path.join(
    getAmplifyDirPath(projectPath),
    amplifyCLIConstants.DotConfigamplifyCLISubDirName,
  ));
}

function getBackendDirPath(projectPath) {
  const path = require('path');
  const amplifyCLIConstants = require('./constants.js');
  return path.normalize(path.join(
    getAmplifyDirPath(projectPath),
    amplifyCLIConstants.BackendamplifyCLISubDirName,
  ));
}

function getCurrentCloudBackendDirPath(projectPath) {
  const path = require('path');
  const amplifyCLIConstants = require('./constants.js');
  return path.normalize(path.join(
    getAmplifyDirPath(projectPath),
    amplifyCLIConstants.CurrentCloudBackendamplifyCLISubDirName,
  ));
}

function getAmplifyRcFilePath(projectPath) {
  const path = require('path');
  if (!projectPath) {
    projectPath = searchProjectRootPath();
  }
  if (projectPath) {
    return path.normalize(path.join(
      projectPath,
      '.amplifyrc',
    ));
  }
  throw new Error('You are not working inside a valid amplify project.\nUse \'amplify init\' in the root of your app directory to initialize your project with Amplify');
}

// ///////////////////level 2

function getProjectConfigFilePath(projectPath) {
  const path = require('path');
  const amplifyCLIConstants = require('./constants.js');
  return path.normalize(path.join(
    getDotConfigDirPath(projectPath),
    amplifyCLIConstants.ProjectConfigFileName,
  ));
}

function getPluginConfigFilePath(projectPath) {
  const path = require('path');
  const amplifyCLIConstants = require('./constants.js');
  return path.normalize(path.join(
    getDotConfigDirPath(projectPath),
    amplifyCLIConstants.PluginConfigFileName,
  ));
}

function getAmplifyMetaFilePath(projectPath) {
  const path = require('path');
  const amplifyCLIConstants = require('./constants.js');
  return path.normalize(path.join(
    getBackendDirPath(projectPath),
    amplifyCLIConstants.amplifyMetaFileName,
  ));
}

function getCurentAmplifyMetaFilePath(projectPath) {
  const path = require('path');
  const amplifyCLIConstants = require('./constants.js');
  return path.normalize(path.join(
    getCurrentCloudBackendDirPath(projectPath),
    amplifyCLIConstants.amplifyMetaFileName,
  ));
}


module.exports = {
  searchProjectRootPath,
  getHomeDotAmplifyDirPath,
  getAmplifyDirPath,
  getDotConfigDirPath,
  getBackendDirPath,
  getAmplifyRcFilePath,
  getProjectConfigFilePath,
  getCurrentCloudBackendDirPath,
  getPluginConfigFilePath,
  getAmplifyMetaFilePath,
  getCurentAmplifyMetaFilePath,
};
