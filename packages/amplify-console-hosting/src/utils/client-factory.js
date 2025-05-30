const constants = require('../constants/plugin-constants');
const AWS = require('aws-sdk');

async function getAmplifyClient(context) {
  const config = await getAWSClient(context);
  console.log(config);
  return new AWS.Amplify(config);
}

async function getS3Client(context) {
  const config = await getAWSClient(context);
  console.log(config);
  return new AWS.S3(config);
}

async function getAWSClient(context) {
  const providerPlugin = context.amplify.getProviderPlugins(context);
  const provider = require(providerPlugin[constants.PROVIDER]);
  return await provider.getConfiguredAWSClient(context, constants.CATEGORY, 'create');
}

module.exports = {
  getAmplifyClient,
  getS3Client,
};
