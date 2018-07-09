const fs = require('fs-extra'); 

function run(context) {
  return new Promise((resolve, reject) => {
    context.exeInfo = {}; 
    const projectConfigFilePath = context.amplify.pathManager.getProjectConfigFilePath();
    if(fs.existsSync(projectConfigFilePath)){
      context.exeInfo.projectConfig = JSON.parse(fs.readFileSync(projectConfigFilePath)); 
    }

    if(context.exeInfo.projectConfig){
      const { projectPath } = context.exeInfo.projectConfig; 
      const backendMetaFilePath = context.amplify.pathManager.getAmplifyMetaFilePath(projectPath);
      if(fs.existsSync(backendMetaFilePath)){
        context.exeInfo.metaData = JSON.parse(fs.readFileSync(backendMetaFilePath)); 
      }
  
      const amplifyRcFilePath = context.amplify.pathManager.getAmplifyRcFilePath(projectPath);
      if(fs.existsSync(amplifyRcFilePath)){
        context.exeInfo.rcData = JSON.parse(fs.readFileSync(amplifyRcFilePath)); 
      }
      resolve(context);
    }else{
      const err = new Error('The project is not in a valid state.');
      reject(err);
    }
  });
}

module.exports = {
  run,
};
