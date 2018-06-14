const fs = require('fs-extra')
const path = require('path')

function run(context){
    return new Promise((resolve, reject)=>{
        const projectPath = process.cwd(); 
        const projectName = path.basename(projectPath); 
        context.initInfo = {
            projectPath, 
            projectName
        }; 
        resolve(context); 
    });
}

module.exports = {
    run
}