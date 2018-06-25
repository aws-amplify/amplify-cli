const path = require('path');
const fs = require('fs');
const amplifyCLIConstants = require('./constants.js');

/* Helpers */

function projectPathValidate(projectPath) {
  let isGood = false;
  if (fs.existsSync(projectPath)) {
    const dotamplifyDirPath = getamplifyDirPath(projectPath);
    const infoSubDirPath = getDotConfigDirPath(projectPath);

    isGood = fs.existsSync(dotamplifyDirPath) &&
            fs.existsSync(infoSubDirPath);
  }
  return isGood;
}

function searchProjectRootPath() {
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

// ///////////////////level 0
function getamplifyDirPath(projectPath) {
  if (!projectPath) {
    projectPath = searchProjectRootPath();
  }
  if (projectPath) {
    return path.normalize(path.join(
      projectPath,
      amplifyCLIConstants.amplifyCLIDirName,
    ));
  }
  throw new Error('you are not working inside a valid amplify project');
}

// ///////////////////level 1
function getDotConfigDirPath(projectPath) {
  return path.normalize(path.join(
    getamplifyDirPath(projectPath),
    amplifyCLIConstants.DotConfigamplifyCLISubDirName,
  ));
}

function getBackendDirPath(projectPath) {
  return path.normalize(path.join(
    getamplifyDirPath(projectPath),
    amplifyCLIConstants.BackendamplifyCLISubDirName,
  ));
}

function getCurrentCloudBackendDirPath(projectPath) {
  return path.normalize(path.join(
    getamplifyDirPath(projectPath),
    amplifyCLIConstants.CurrentCloudBackendamplifyCLISubDirName,
  ));
}


// ///////////////////level 2

function getProjectConfigFilePath(projectPath) {
  return path.normalize(path.join(
    getDotConfigDirPath(projectPath),
    amplifyCLIConstants.ProjectConfigFileName,
  ));
}

function getPluginConfigFilePath(projectPath) {
  return path.normalize(path.join(
    getDotConfigDirPath(projectPath),
    amplifyCLIConstants.PluginConfigFileName,
  ));
}

function getamplifyMetaFilePath(projectPath) {
  return path.normalize(path.join(
    getBackendDirPath(projectPath),
    amplifyCLIConstants.amplifyMetaFileName,
  ));
}

function getCurentBackendCloudamplifyMetaFilePath(projectPath) {
  return path.normalize(path.join(
    getCurrentCloudBackendDirPath(projectPath),
    amplifyCLIConstants.amplifyMetaFileName,
  ));
}


module.exports = {
  searchProjectRootPath,
  getamplifyDirPath,
  getDotConfigDirPath,
  getBackendDirPath,
  getProjectConfigFilePath,
  getCurrentCloudBackendDirPath,
  getPluginConfigFilePath,
  getamplifyMetaFilePath,
  getCurentBackendCloudamplifyMetaFilePath,
};
