const aws = require('aws-sdk');
const moment = require('moment');
const path = require('path');
const fs = require('fs-extra');
const constants = require('../constants')
const configurationManager = require('./configuration-manager');

function run(context) {
    return configurationManager.init(context)
    .then(context=>{
        return new Promise((resolve, reject)=>{
            const awscfn = getConfiguredAwsCfnClient(context); 
            const initTemplateFilePath = path.join(__dirname, 'rootStackTemplate.json');
            const timeStamp = `-${moment().format('YYYYMMDDHHmmss')}`;
            const stackName = context.initInfo.projectName + timeStamp;
            const deploymentBucketName = `${stackName}-deployment`;
            const params = {
            StackName: stackName,
            TemplateBody: fs.readFileSync(initTemplateFilePath).toString(),
            Parameters: [
                {
                ParameterKey: 'DeploymentBucketName',
                ParameterValue: deploymentBucketName,
                },
            ],
            };
    
            awscfn.createStack(params, (err, data) => {
                if (err) {
                    reject(err); 
                } else {
                    processStackCreationData(context, params, data);
                    resolve(context);
                }
            });
        })
    }); 
}

function getConfiguredAwsCfnClient(context){
    const projectConfigInfo = context.projectConfigInfo; 
    process.env.AWS_SDK_LOAD_CONFIG = true; 
    if(projectConfigInfo.action == 'init'){
        if(projectConfigInfo.useProfile && projectConfigInfo.profileName){
            process.env.AWS_PROFILE = projectConfigInfo.profileName; 
        }else{
            aws.config.update(
                {
                    accessKeyId: projectConfigInfo.accessKeyId, 
                    secretAccessKey: projectConfigInfo.secretAccessKey, 
                    region: projectConfigInfo.region, 
                }
            );
        }
    }
    return new aws.CloudFormation();
}

function processStackCreationData(context, params, data) {
    const metaData = {
        StackId: data.StackId,
        StackName: params.StackName,
        DeploymentBucket: params.Parameters[0].ParameterValue,
    };
    context.initInfo.metaData.provider = {};
    context.initInfo.metaData.provider[constants.ProviderName] = metaData;
}

function onInitSuccessful(context){
    configurationManager.onInitSuccessful(context); 
    stampAmplifyRunControl(context.initInfo.projectPath, context.initInfo.metaData);
}
  
function stampAmplifyRunControl(projectPath, metaData) {
    const filePath = path.join(projectPath, '.amplifyrc');
    const jsonString = JSON.stringify(metaData, null, 4);
    fs.writeFileSync(filePath, jsonString, 'utf8');
}
  
module.exports = {
    run,
    onInitSuccessful,
};
