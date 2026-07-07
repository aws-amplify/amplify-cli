const constants = require('../constants/plugin-constants');
const { AmplifyClient } = require('@aws-sdk/client-amplify');
const { S3Client } = require('@aws-sdk/client-s3');

async function getAmplifyClient(context) {
  const config = await getAWSClientConfig(context);
  return new AmplifyClient(config);
}

async function getS3Client(context) {
  const config = await getAWSClientConfig(context);
  return new S3Client(config);
}

async function getAWSClientConfig(context) {
  const providerPlugin = context.amplify.getProviderPlugins(context);
  const provider = require(providerPlugin[constants.PROVIDER]);
  return await provider.getConfiguredAWSClientConfig(context, constants.CATEGORY, 'create');
}

module.exports = {
  getAmplifyClient,
  getS3Client,
};
