const path = require('path'); 
const fs = require('fs-extra');
let awsClient = require('aws-sdk'); 

/* eslint-disable */
function configure(context) {/* eslint-enable */
}

function loadProjectConfig(context, awsClient){
    process.env.AWS_SDK_LOAD_CONFIG = true; 
    const configInfoFilePath = path.join(context.awsmobile.pathManager.getDotConfigDirPath(), 'aws-info.json')
    if(fs.existsSync(configInfoFilePath)){
        const configInfo = JSON.parse(fs.readFileSync(configInfoFilePath, 'utf8')); 
        if(configInfo.IsUsingProfile && configInfo.ProfileName){
            console.log('profileName: ', configInfo.ProfileName); 
            process.env.AWS_PROFILE = configInfo.ProfileName; 
        }else if(configInfo.AWSConfigFilePath && fs.existsSync(configInfo.AWSConfigFilePath)){
            awsClient.config.loadFromPath(configInfo.AWSConfigFilePath);
        }
    }
}

module.exports = {
  configure,
  getConfiguration,
  loadProjectConfig
};
