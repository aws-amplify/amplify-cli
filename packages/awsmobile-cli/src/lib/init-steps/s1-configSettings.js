const fs = require('fs-extra'); 
const path = require('path'); 

function run(context){
    return new Promise((resolve, reject)=>{
        //insert the provider selection logic here
        context.initInfo.projectConfig = {
            projectName: context.initInfo.projectName, 
            projectPath: context.initInfo.projectPath, 
            providers : {
                awscfn: "awsmobile-provider-cloudformation"
            }
        }; 

        context.initInfo.metaData = {
        }; 
        
        resolve(context);
    });
}

module.exports = {
    run
}