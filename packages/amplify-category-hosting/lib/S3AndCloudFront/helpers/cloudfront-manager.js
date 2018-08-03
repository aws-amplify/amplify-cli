const constants = require('../../constants'); 

const serviceName = 'S3AndCloudFront';
const providerName = 'awscloudformation';

function checkValidation(context){
    if(context.parameters.options['invalidateCloudFront'] || 
        context.parameters.options['cloudFront'] ||
        context.parameters.options['c'] ){
            return invalidate(context);
    }
}

async function invalidate(context){
    let result = context; 
    if(context.exeInfo.serviceMeta && 
        context.exeInfo.serviceMeta.output && 
        context.exeInfo.serviceMeta.output.CloudFrontDistributionID){

        let cloudFront = await getCloudFrontClient(context)
        let invalidateParams = {
            DistributionId: context.exeInfo.serviceMeta.output.CloudFrontDistributionID,
            InvalidationBatch: {
                Paths: {
                    Quantity: 1,
                    Items: ['/*']
                },
                CallerReference: Date.now().toString()
            }
        }
        result = new Promise((resolve, reject) => {
                cloudFront.createInvalidation(invalidateParams, function(err, data){
                if(err){
                    reject(err); 
                }else{
                    resolve(context); 
                }
            })
        }); 
    }
    return result; 
}

async function getCloudFrontClient(context) {
    const { projectConfig } = context.exeInfo;
    const provider = require(projectConfig.providers[providerName]);
    const aws = await provider.getConfiguredAWSClient(context);
    return new aws.CloudFront();
}

module.exports = {
    checkValidation
};
  