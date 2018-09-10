const path = require('path'); 
const os = require('os'); 
const minimatch = require("minimatch");
const fs = require('fs-extra'); 

const constants = require('../../constants'); 

function getAmplifyIgnore(context){
    let result = []; 
    const { projectConfig } = context.exeInfo; 
    const filePath = path.join(projectConfig.projectPath, constants.AmplifyIgnoreFileName);
    if(fs.existsSync(filePath)){
        const fileContents = fs.readFileSync(filePath, "utf8"); 
        result = fileContents.split(os.EOL)
                        .map(line => line.trim())
                        .filter(line=>line.length>0)
                        .filter(line=>!/^#/.test(line)); 
    }
    console.log(result);
    return result; 
}

function isIgnored(file, ignore){
    let result = false;
    if(ignore.length>0){
        for(let i=0; i<ignore.length; i++){
            if(minimatch(file, ignore[i])){
                result = true; 
                break; 
            }
        }
    }
    return result; 
}

module.exports = {
    getAmplifyIgnore,
    isIgnored
}