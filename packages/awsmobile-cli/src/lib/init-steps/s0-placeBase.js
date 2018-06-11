const fs = require('fs-extra')

function run(context){
    return new Promise((resolve, reject)=>{
        const projectPath = process.cwd(); 
        const mobile = context.awsmobile; 

        context.initInfo = {}; 
        const awsmobileDirPath = mobile.pathManager.getAwsmobileDirPath(projectPath); 
        const dotConfigDirPath = mobile.pathManager.getDotConfigDirPath(projectPath); 
        const backendDirPath = mobile.pathManager.getBackendDirPath(projectPath); 
        const currentBackendDirPath = mobile.pathManager.getCurrentCloudBackendDirPath(projectPath); 
    
        fs.ensureDirSync(awsmobileDirPath); 
        fs.ensureDirSync(dotConfigDirPath); 
        fs.ensureDirSync(backendDirPath); 
        fs.ensureDirSync(currentBackendDirPath); 
        
        resolve(context); 
    });
}

module.exports = {
    run
}