const fs = require('fs-extra');
const sequential = require('promise-sequential');
const { print } = require('gluegun/print');

function run(context) {
  const { projectPath } = context.initInfo;
  const { amplify } = context;

  const amplifyDirPath = amplify.pathManager.getAmplifyDirPath(projectPath);
  const dotConfigDirPath = amplify.pathManager.getDotConfigDirPath(projectPath);
  const backendDirPath = amplify.pathManager.getBackendDirPath(projectPath);
  const currentBackendDirPath = amplify.pathManager.getCurrentCloudBackendDirPath(projectPath);

  fs.ensureDirSync(amplifyDirPath);
  fs.ensureDirSync(dotConfigDirPath);
  fs.ensureDirSync(backendDirPath);
  fs.ensureDirSync(currentBackendDirPath);
  const providerOnSuccessTasks = [];
  const { providers } = context.initInfo.projectConfig;
  Object.keys(providers).forEach((providerKey) => {
    const provider = require(providers[providerKey]);
    providerOnSuccessTasks.push(() => provider.onInitSuccessful(context));
  });

  return sequential(providerOnSuccessTasks)
  .then(()=>{
    const handlerName = Object.keys(context.initInfo.projectConfig.frontendHandler)[0]; 
    const frontendHandler = require(context.initInfo.projectConfig.frontendHandler[handlerName]);
    return frontendHandler.onInitSuccessful(context); 
  })
  then(()=>{
    let jsonString = JSON.stringify(context.initInfo.projectConfig, null, 4);
    const projectCofnigFilePath = amplify.pathManager.getProjectConfigFilePath(projectPath);
    fs.writeFileSync(projectCofnigFilePath, jsonString, 'utf8');
  
    jsonString = JSON.stringify(context.initInfo.metaData, null, 4);
    const currentBackendMetaFilePath =
              amplify.pathManager.getCurentBackendCloudamplifyMetaFilePath(projectPath);
    fs.writeFileSync(currentBackendMetaFilePath, jsonString, 'utf8');
    const backendMetaFilePath = amplify.pathManager.getAmplifyMetaFilePath(projectPath);
    fs.writeFileSync(backendMetaFilePath, jsonString, 'utf8');
  
  
    jsonString = JSON.stringify(context.initInfo.rcData, null, 4);
    const amplifyRcFilePath = amplify.pathManager.getAmplifyRcFilePath(projectPath);
    fs.writeFileSync(amplifyRcFilePath, jsonString, 'utf8');
  
    printWelcomeMessage(projectPath);
  });
}


function printWelcomeMessage(projectPath){
  console.log()
  console.log('Success! your project is now initialized with amplify')
  console.log()
}

module.exports = {
  run,
};
