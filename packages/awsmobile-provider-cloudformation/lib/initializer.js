const aws = require('aws-sdk');
const util = require('util'); 
const moment = require('moment'); 
const path = require('path'); 
const fs = require('fs-extra'); 

function run(context){
    return new Promise((resolve, reject)=>{
        console.log('init CloudFormation///////////////')
        aws.config.update({
            accessKeyId: "AKIAJ2IWIRMJYPRJO6WA",//"<accessKeyId>",
            secretAccessKey: "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",//"<secretAccessKey>",
            region: "us-east-1",//"<region>"
        }); 

        const awscfn = new aws.CloudFormation(); 
        const initTemplateFilePath = path.join(__dirname, 'parentStackTemplate.json');
        const timeStamp = '-' + moment().format("YYYYMMDDHHmmss");
        const params = {
            StackName: context.initInfo.projectName + timeStamp,
            TemplateBody: fs.readFileSync(initTemplateFilePath).toString(), 
            Parameters: [
                {
                    ParameterKey: "DeploymentBucketName",   
                    ParameterValue: context.initInfo.projectName + timeStamp        
                }                     
            ]
        }; 

        awscfn.createStack(params, (err, data)=>{
            if(err){
                reject(err); 
            }else{
                processStackCreationData(context, data)
                resolve(context)
            }
        });
    });
}

function processStackCreationData(context, data){
    console.log('CloudFormation init returned/////////////////');
    console.log(util.inspect(data));
    context.cloufFormationInitResponse = data; 
}

module.exports = {
    run
}