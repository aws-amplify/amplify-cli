const fs = require('fs-extra'); 
const path = require('path'); 

function run(context){
    return new Promise((resolve, reject)=>{
        const projectPath = process.cwd(); 
        const mobile = context.awsmobile; 

        context.initInfo.projectPath = projectPath; 
        context.initInfo.projectName = path.basename(projectPath); 
        //insert the provider selection logic here
        const projectConfig = {
            projectName: context.initInfo.projectName, 
            projectPath: context.initInfo.projectPath, 
            providers : {
                awscfn: "awsmobile-provider-cloudformation"
            }
        }; 
        context.initInfo.projectConfig = projectConfig; 

        const meta = {
        }; 
        context.initInfo.meta = meta; 

        let jsonString = JSON.stringify(projectConfig, null, 4);
        const projectCofnigFilePath = mobile.pathManager.getProjectConfigFilePath(projectPath); 
        fs.writeFileSync(projectCofnigFilePath, jsonString, 'utf8');

        jsonString = JSON.stringify(meta, null, 4);
        const currentBackendMetaFilePath = mobile.pathManager.getCurentBackendCloudAwsmobileMetaFilePath(projectPath);
        fs.writeFileSync(currentBackendMetaFilePath, jsonString, 'utf8');
        const backendMetaFilePath = mobile.pathManager.getAwsmobileMetaFilePath(projectPath);
        fs.writeFileSync(backendMetaFilePath, jsonString, 'utf8');
        
        resolve(context);
    });
}

module.exports = {
    run
}