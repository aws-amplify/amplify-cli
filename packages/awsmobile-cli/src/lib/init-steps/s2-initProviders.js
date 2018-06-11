function run(context){
    const projectPath = process.cwd(); 
    const mobile = context.awsmobile; 

    let initializationTasks = []

    Object.keys(context.initInfo.projectConfig.providers).forEach((providerKey)=>{
        const provider = require(context.initInfo.projectConfig.providers[providerKey]); 
        initializationTasks.push(
            provider.init(context)
        )
    })

    return Promise.all(initializationTasks).then((values)=>{
        return context
    })
}

module.exports = {
    run
}