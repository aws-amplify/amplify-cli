const fs = require('fs-extra'); 

function run(context){
    const projectPath = process.cwd(); 
    const mobile = context.awsmobile; 

    //todo: insert provider selections
    const projectCofnigFilePath = mobile.pathManager.getProjectConfigFilePath(projectPath); 
    const projectConfig = {
        "providers" : {
            awscfn: "awsmobile-provider-awscfn"
        }
    }; 
    let jsonString = JSON.stringify(projectConfig, null, 4);
    fs.writeFileSync(projectCofnigFilePath, jsonString, 'utf8');
    context.projectConfig = projectConfig; 

    const backendMetaFilePath = mobile.pathManager.getAwsmobileMetaFilePath(projectPath);
    const meta = {
    }; 
    jsonString = JSON.stringify(meta, null, 4);
    fs.writeFileSync(backendMetaFilePath, jsonString, 'utf8');
    context.meta = meta; 
    
    return context; 
}

module.exports = {
    run
}