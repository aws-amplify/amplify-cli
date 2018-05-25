const path = require('path');
const fs = require('fs');
const amplifyCLIConstants = require('./constants.js');


//////////////////////////////////////////////////////////////////////
//////////////////// for user project        /////////////////////////
//////////////////////////////////////////////////////////////////////

/////////////////////level 0
function getAmplifyDirPath(projectPath)
{
    if(!projectPath) {
        projectPath = searchProjectRootPath();
    }
    return path.normalize(path.join(projectPath, amplifyCLIConstants.AmplifyCLIDirName));
}

/////////////////////level 1
function getDotConfigDirPath(projectPath)
{
    return path.normalize(path.join(getAmplifyDirPath(projectPath), amplifyCLIConstants.DotConfigAmplifyCLISubDirName));
}

function getBackendDirPath(projectPath)
{
    return path.normalize(path.join(getAmplifyDirPath(projectPath), amplifyCLIConstants.BackendAmplifyCLISubDirName));
}


/////////////////////level 2

function getProjectConfigFilePath(projectPath)
{
    return path.normalize(path.join(getDotConfigDirPath(projectPath), amplifyCLIConstants.ProjectConfigFileName));
}

function getProjectInfoFilePath(projectPath)
{
    return path.normalize(path.join(getDotConfigDirPath(projectPath), amplifyCLIConstants.ProjectInfoFileName));
}

function searchProjectRootPath()
{
    let result;
    let currentPath = process.cwd();

    do{
        if(projectPathValidate(currentPath)){
            result = currentPath;
            break 
        }else{
            let parentPath = path.dirname(currentPath);
            if(currentPath == parentPath){
                break;
            }else{
                currentPath = parentPath;
            }
        }
    }while(true);

    return result;
}

function projectPathValidate(projectPath) {
  let isGood = false

  if(fs.existsSync(projectPath)){
    const dotAwsMobileDirPath = getAmplifyDirPath(projectPath);
    const infoSubDirPath = getDotConfigDirPath(projectPath);
    const projectInfoFilePath = getProjectInfoFilePath(projectPath);
    const projectConfigFilePath = getProjectConfigFilePath(projectPath);
    const backendDirPath = getBackendDirPath(projectPath);
   
    isGood = fs.existsSync(dotAwsMobileDirPath) && 
              fs.existsSync(infoSubDirPath) && 
              fs.existsSync(projectInfoFilePath) &&
              fs.existsSync(backendDirPath);

  }

  return isGood;
}

module.exports = {
    getAmplifyDirPath,
    getDotConfigDirPath,
    getBackendDirPath,
    getProjectConfigFilePath,
    getProjectInfoFilePath
}
  