const aws = require('aws-sdk');
const util = require('util'); 
const moment = require('moment'); 
const path = require('path'); 
const fs = require('fs-extra'); 

function run(context){
    return new Promise((resolve, reject)=>{
        const region = "<region>";
        const credential = {
            accessKeyId: "<accessKeyId>",
            secretAccessKey: "<secretAccessKey>",
        }
        aws.config.update({
            accessKeyId: credential.accessKeyId,
            secretAccessKey: credential.secretAccessKey,
            region: region,
        }); 

        const awscfn = new aws.CloudFormation(); 
        const initTemplateFilePath = path.join(__dirname, 'rootStackTemplate.json');
        const timeStamp = '-' + moment().format("YYYYMMDDHHmmss");
        const stackName = context.initInfo.projectName + timeStamp; 
        const deploymentBucketName = stackName + '-deployment'; 
        const params = {
            StackName: stackName,
            TemplateBody: fs.readFileSync(initTemplateFilePath).toString(), 
            Parameters: [
                {
                    ParameterKey: "DeploymentBucketName",   
                    ParameterValue: deploymentBucketName
                }                     
            ]
        }; 

        awscfn.createStack(params, (err, data)=>{
            if(err){
                reject(err); 
            }else{
                processStackCreationData(context, region, params, data)
                resolve(context)
            }
        });
    });
}

function processStackCreationData(context, region, params, data){
    const metaData = {
        Region: region,
        StackId: data.StackId, 
        StackName: params.StackName,
        DeploymentBucket: params.Parameters[0]['ParameterValue']
    }; 
    context.initInfo.metaData['awsmobile-provider-cloudformation'] = metaData; 
}

module.exports = {
    run
}