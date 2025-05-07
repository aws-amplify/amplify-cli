const constants = require('../constants/plugin-constants');
const AWS = require('aws-sdk');

async function getAmplifyClient(context) {
  const config = await getAWSClient(context);
  return new AWS.Amplify(config);
}

async function getS3Client(context) {
  const config = await getAWSClient(context);
  return new AWS.S3(config);
}

// **this is a problem and needs to be fixed
async function getAWSClient(context) {
  const providerPlugin = context.amplify.getProviderPlugins(context);
  const provider = require(providerPlugin[constants.PROVIDER]);
  return await provider.getConfiguredAWSClient(context, constants.CATEGORY, 'create');
}

function getAWSProvider(context) {
  const providerPlugin = context.amplify.getProviderPlugins(context);
  return require(providerPlugin[constants.PROVIDER]);
}

module.exports = {
  getAmplifyClient,
  getS3Client,
};
