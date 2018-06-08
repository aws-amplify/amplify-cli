const fs = require('fs-extra'); 

function run(context){
    const projectPath = process.cwd(); 
    const mobile = context.awsmobile; 
    const awsmobileDirPath = mobile.pathManager.getAwsmobileDirPath(projectPath); 
    const dotConfigDirPath = mobile.pathManager.getDotConfigDirPath(projectPath); 
    const backendDirPath = mobile.pathManager.getBackendDirPath(projectPath); 
    const currentBackendDirPath = mobile.pathManager.getCurrentCloudBackendDirPath(projectPath); 

    fs.ensureDirSync(awsmobileDirPath); 
    fs.ensureDirSync(dotConfigDirPath); 
    fs.ensureDirSync(backendDirPath); 
    fs.ensureDirSync(currentBackendDirPath); 


    const projectCofnigFilePath = mobile.pathManager.getProjectConfigFilePath(projectPath); 
    const projectConfig = {
        "SourceDir": "src",
        "DistributionDir": "build",
        "BuildCommand": "build",
        "StartCommand": "npm run-script start",
        "ProjectName": "myProject123",
        "Framework": "react"
    }; 
    let jsonString = JSON.stringify(projectConfig, null, 4);
    fs.writeFileSync(projectCofnigFilePath, jsonString, 'utf8');
}

module.exports = {
    run
}