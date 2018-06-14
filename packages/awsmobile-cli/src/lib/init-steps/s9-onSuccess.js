const fs = require('fs-extra'); 

function run(context){
    const projectPath = context.initInfo.projecPath; 
    const mobile = context.awsmobile; 
    const awsmobileDirPath = mobile.pathManager.getAwsmobileDirPath(projectPath); 
    const dotConfigDirPath = mobile.pathManager.getDotConfigDirPath(projectPath); 
    const backendDirPath = mobile.pathManager.getBackendDirPath(projectPath); 
    const currentBackendDirPath = mobile.pathManager.getCurrentCloudBackendDirPath(projectPath); 

    fs.ensureDirSync(awsmobileDirPath); 
    fs.ensureDirSync(dotConfigDirPath); 
    fs.ensureDirSync(backendDirPath); 
    fs.ensureDirSync(currentBackendDirPath); 

    let jsonString = JSON.stringify(context.initInfo.projectConfig, null, 4);
    const projectCofnigFilePath = mobile.pathManager.getProjectConfigFilePath(projectPath); 
    fs.writeFileSync(projectCofnigFilePath, jsonString, 'utf8');

    jsonString = JSON.stringify(context.initInfo.metaData, null, 4);
    const currentBackendMetaFilePath = mobile.pathManager.getCurentBackendCloudAwsmobileMetaFilePath(projectPath);
    fs.writeFileSync(currentBackendMetaFilePath, jsonString, 'utf8');
    const backendMetaFilePath = mobile.pathManager.getAwsmobileMetaFilePath(projectPath);
    fs.writeFileSync(backendMetaFilePath, jsonString, 'utf8');
    console.log('init successfully!')
}

module.exports = {
    run
}