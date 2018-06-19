const path = require('path'); 
const fs = require('fs-extra');
let awsClient = require('aws-sdk'); 

/* eslint-disable */
function configure(context) {/* eslint-enable */
}

// function getConfiguration(context){
// }

/* eslint-disable */
function getConfiguration(context) {/* eslint-enable */
    const region = "us-east-1";//"<region>";
    const credential = {
        accessKeyId: "AKIAJ2IWIRMJYPRJO6WA",//"<accessKeyId>",
        secretAccessKey: "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",//"<secretAccessKey>",
    }
    return {
        accessKeyId: credential.accessKeyId,
        secretAccessKey: credential.secretAccessKey,
        region,
    };
}

function getConfiguredAWSClient(context){
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

    return new Promise((resolve) => {
        awsClient.config.setPromisesDependency(Promise)
        resolve(awsClient);
    }); 
}

module.exports = {
  configure,
  getConfiguration,
  getConfiguredAWSClient
};
