const aws = require('aws-sdk');
const configurationManager = require('../lib/configuration-manager');

async function getConfiguredLambdaClient(context, awsOptions) {
  await configurationManager.loadConfiguration(context, aws);
  aws.config.update(awsOptions);
  return new aws.Lambda();
}
async function getConfiguredDynamoDbClient(context, awsOptions) {
  await configurationManager.loadConfiguration(context, aws);
  aws.config.update(awsOptions);
  return new aws.DynamoDB();
}
async function getConfiguredPinpointClient(context, awsOptions) {
  await configurationManager.loadConfiguration(context, aws);
  aws.config.update(awsOptions);
  return new aws.Pinpoint();
}
async function getLambdaFunctionDetails(context, options, name) {
  const awsOptions = {};
  if (options.region) {
    awsOptions.region = options.region;
  }
  const lambda = await getConfiguredLambdaClient(context, awsOptions);
  const result = await lambda.getFunction({ FunctionName: name }).promise();
  return result;
}
async function getDynamoDbDetails(context, options, name) {
  const awsOptions = {};
  if (options.region) {
    awsOptions.region = options.region;
  }
  const dynamoDb = await getConfiguredDynamoDbClient(context, awsOptions);
  const result = await dynamoDb.describeTable({ TableName: name }).promise();
  return result;
}
async function getPinpointChannelDetail(context, options, channel, applicationId) {
  const awsOptions = {};
  if (options.region) {
    awsOptions.region = options.region;
  }
  const pinpoint = await getConfiguredPinpointClient(context, awsOptions);
  if (channel === 'SMS') {
    return await pinpoint.getSmsChannel({ ApplicationId: applicationId }).promise();
  }
  if (channel === 'Email') {
    return await pinpoint.getEmailChannel({ ApplicationId: applicationId }).promise();
  }
  if (channel === 'GCM') {
    return await pinpoint.getGcmChannel({ ApplicationId: applicationId }).promise();
  }
  if (channel === 'APNS') {
    return await pinpoint.getApnsChannel({ ApplicationId: applicationId }).promise();
  }
}

module.exports = {
  getLambdaFunctionDetails,
  getDynamoDbDetails,
  getPinpointChannelDetail,
};
