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
    
    return context; 
}

module.exports = {
    run
}