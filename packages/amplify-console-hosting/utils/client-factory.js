const constants = require('../constants/plugin-constants');
const ora = require('ora');

async function getAmplifyClient(context) {
  const spinner = ora();
  spinner.start('Initializing amplify client');
  const AWS = await getAWSClient(context);
  spinner.succeed('Initializing amplify client completed');
  return new AWS.Amplify();
}

async function getAWSClient(context) {
  const providerPlugin = context.amplify.getProviderPlugins(context);
  const provider = require(providerPlugin[constants.PROVIDER]);
  return await provider.getConfiguredAWSClient(context, constants.CATEGORY, 'create');
}

module.exports = {
  getAmplifyClient,
};
