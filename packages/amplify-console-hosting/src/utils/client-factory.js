const constants = require('../constants/plugin-constants');
const AWS = require('aws-sdk');

async function getAmplifyClient(context) {
  const config = await getAWSClientConfig(context);
  return new AWS.Amplify(config);
}

async function getS3Client(context) {
  const config = await getAWSClientConfig(context);
  return new AWS.S3(config);
}

async function getAWSClientConfig(context) {
  const providerPlugin = context.amplify.getProviderPlugins(context);
  const provider = require(providerPlugin[constants.PROVIDER]);
  return await provider.getConfiguredAWSClientConfig(context, constants.CATEGORY, 'create');
}

module.exports = {
  getAWSClientConfig,
  getS3Client,
};
