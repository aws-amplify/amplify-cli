const constants = require('../constants/plugin-constants');

async function getAmplifyClient(context) {
  const AWS = await getAWSClient(context);
  const provider = getAWSProvider(context);
  return new AWS.Amplify({ customUserAgent: provider.getUserActionParam(context, constants.CATEGORY, 'create') });
}

async function getS3Client(context) {
  const AWS = await getAWSClient(context);
  const provider = getAWSProvider(context);
  return new AWS.S3({ customUserAgent: provider.getUserActionParam(context, constants.CATEGORY, 'create') });
}

// **this is a problem and needs to be fixed
async function getAWSClient(context) {
  const providerPlugin = context.amplify.getProviderPlugins(context);
  const provider = require(providerPlugin[constants.PROVIDER]);
  //return await provider.getConfiguredAWSClient(context, constants.CATEGORY, 'create');
  return await provider.getAWSConfiguration(context, constants.CATEGORY, 'create');
}

function getAWSProvider(context) {
  const providerPlugin = context.amplify.getProviderPlugins(context);
  return require(providerPlugin[constants.PROVIDER]);
}

module.exports = {
  getAmplifyClient,
  getS3Client,
};
