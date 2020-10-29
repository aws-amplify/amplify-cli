const constants = require('../constants/plugin-constants');

async function getAmplifyClient(context) {
  const AWS = await getAWSClient(context);
  return new AWS.Amplify();
}

async function getS3Client(context) {
  const AWS = await getAWSClient(context);
  return new AWS.S3();
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
