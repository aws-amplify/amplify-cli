const path = require('path');
const fs = require('fs');
const awsmobileCLIConstants = require('./constants.js');


//////////////////////////////////////////////////////////////////////
//////////////////// for user project        /////////////////////////
//////////////////////////////////////////////////////////////////////

/////////////////////level 0
function getAwsmobileDirPath(projectPath)
{
    if(!projectPath) {
        projectPath = searchProjectRootPath();
    }
    return path.normalize(path.join(projectPath, awsmobileCLIConstants.AwsmobileCLIDirName));
}

/////////////////////level 1
function getDotConfigDirPath(projectPath)
{

    return path.normalize(path.join(getAwsmobileDirPath(projectPath), awsmobileCLIConstants.DotConfigAwsmobileCLISubDirName));
}

function getBackendDirPath(projectPath)
{
    return path.normalize(path.join(getAwsmobileDirPath(projectPath), awsmobileCLIConstants.BackendAwsmobileCLISubDirName));
}


/////////////////////level 2

function getProjectConfigFilePath(projectPath)
{
    return path.normalize(path.join(getDotConfigDirPath(projectPath), awsmobileCLIConstants.ProjectConfigFileName));
}

function getProjectInfoFilePath(projectPath)
{
    return path.normalize(path.join(getDotConfigDirPath(projectPath), awsmobileCLIConstants.ProjectInfoFileName));
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
    const dotAwsmobileDirPath = getAwsmobileDirPath(projectPath);
    const infoSubDirPath = getDotConfigDirPath(projectPath);
    const projectInfoFilePath = getProjectInfoFilePath(projectPath);
    const projectConfigFilePath = getProjectConfigFilePath(projectPath);
   
    isGood = fs.existsSync(dotAwsmobileDirPath) && 
              fs.existsSync(infoSubDirPath) && 
              fs.existsSync(projectInfoFilePath)

  }

  return isGood;
}

module.exports = {
    getAwsmobileDirPath,
    getDotConfigDirPath,
    getBackendDirPath,
    getProjectConfigFilePath,
    getProjectInfoFilePath
}
  