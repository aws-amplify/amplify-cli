const path = require('path');
const fs = require('fs');
const chalk = require('chalk')
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

function getPluginConfigFilePath(projectPath)
{
    return path.normalize(path.join(getDotConfigDirPath(projectPath), awsmobileCLIConstants.PluginConfigFileName));
}

function getAwsmobileMetaFilePath(projectPath)
{
    return path.normalize(path.join(getBackendDirPath(projectPath), awsmobileCLIConstants.AwsMobileMetaFileName));
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
  if(projectPath === "/") {
    console.log(chalk.red('You are not in a valid AWS mobile project'));
    process.exit(1);
  }
  let isGood = false
  if(fs.existsSync(projectPath)){
    const dotAwsmobileDirPath = getAwsmobileDirPath(projectPath);
    const infoSubDirPath = getDotConfigDirPath(projectPath);
    const pluginConfigFilePath = getPluginConfigFilePath(projectPath);
    const projectConfigFilePath = getProjectConfigFilePath(projectPath);
   
    isGood = fs.existsSync(dotAwsmobileDirPath) && 
              fs.existsSync(infoSubDirPath) && 
              fs.existsSync(pluginConfigFilePath) &&
              fs.existsSync(projectConfigFilePath)

  }
  return isGood;
}

module.exports = {
    getAwsmobileDirPath,
    getDotConfigDirPath,
    getBackendDirPath,
    getProjectConfigFilePath,
    getPluginConfigFilePath,
    getAwsmobileMetaFilePath
}
  