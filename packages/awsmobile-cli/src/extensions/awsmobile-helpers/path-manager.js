const path = require('path');
const fs = require('fs');
const awsmobileCLIConstants = require('./constants.js');

/* Helpers */

function projectPathValidate(projectPath) {
  let isGood = false;
  if (fs.existsSync(projectPath)) {
    const dotAwsmobileDirPath = getAwsmobileDirPath(projectPath);
    const infoSubDirPath = getDotConfigDirPath(projectPath);

    isGood = fs.existsSync(dotAwsmobileDirPath) &&
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
function getAwsmobileDirPath(projectPath) {
  if (!projectPath) {
    projectPath = searchProjectRootPath();
  }
  if (projectPath) {
    return path.normalize(path.join(
      projectPath,
      awsmobileCLIConstants.AwsmobileCLIDirName,
    ));
  }
  throw new Error('you are not working inside a valid awsmobile project');
}

// ///////////////////level 1
function getDotConfigDirPath(projectPath) {
  return path.normalize(path.join(
    getAwsmobileDirPath(projectPath),
    awsmobileCLIConstants.DotConfigAwsmobileCLISubDirName,
  ));
}

function getBackendDirPath(projectPath) {
  return path.normalize(path.join(
    getAwsmobileDirPath(projectPath),
    awsmobileCLIConstants.BackendAwsmobileCLISubDirName,
  ));
}

function getCurrentCloudBackendDirPath(projectPath) {
  return path.normalize(path.join(
    getAwsmobileDirPath(projectPath),
    awsmobileCLIConstants.CurrentCloudBackendAwsmobileCLISubDirName,
  ));
}


// ///////////////////level 2

function getProjectConfigFilePath(projectPath) {
  return path.normalize(path.join(
    getDotConfigDirPath(projectPath),
    awsmobileCLIConstants.ProjectConfigFileName,
  ));
}

function getPluginConfigFilePath(projectPath) {
  return path.normalize(path.join(
    getDotConfigDirPath(projectPath),
    awsmobileCLIConstants.PluginConfigFileName,
  ));
}

function getAwsmobileMetaFilePath(projectPath) {
  return path.normalize(path.join(
    getBackendDirPath(projectPath),
    awsmobileCLIConstants.AwsMobileMetaFileName,
  ));
}

function getCurentBackendCloudAwsmobileMetaFilePath(projectPath) {
  return path.normalize(path.join(
    getCurrentCloudBackendDirPath(projectPath),
    awsmobileCLIConstants.AwsMobileMetaFileName,
  ));
}


module.exports = {
  searchProjectRootPath,
  getAwsmobileDirPath,
  getDotConfigDirPath,
  getBackendDirPath,
  getProjectConfigFilePath,
  getCurrentCloudBackendDirPath,
  getPluginConfigFilePath,
  getAwsmobileMetaFilePath,
  getCurentBackendCloudAwsmobileMetaFilePath,
};
