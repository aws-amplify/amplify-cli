const { AmplifyClient } = require('@aws-sdk/client-amplify');
const { NodeHttpHandler } = require('@smithy/node-http-handler');
const configurationManager = require('../configuration-manager');
const { regions: amplifyServiceRegions } = require('../aws-regions');
const { proxyAgent } = require('./aws-globals');

async function getConfiguredAmplifyClient(context, options = {}) {
  let cred = {};
  let defaultOptions = {};
  const envVarEndpoint = process.env.AWS_AMPLIFY_ENDPOINT;

  try {
    cred = await configurationManager.loadConfiguration(context);
  } catch (e) {
    // ignore missing config
  }

  if (envVarEndpoint) {
    defaultOptions = {
      endpoint: envVarEndpoint,
    };
  }

  const config = {
    ...cred,
    ...defaultOptions,
    ...options,
    requestHandler: new NodeHttpHandler({
      httpAgent: proxyAgent(),
      httpsAgent: proxyAgent(),
    }),
    maxAttempts: 10,
    retryMode: 'adaptive',
  };

  // this is the "project" config level case, creds and region are explicitly set or retrieved from a profile
  if (config.region) {
    if (amplifyServiceRegions.includes(config.region)) {
      return new AmplifyClient(config);
    }
    return undefined;
  }
  // this is the "general" config level case, aws sdk will resolve creds and region from env variables etc.
  return new AmplifyClient(config);
}

function printAuthErrorMessage(context) {
  context.print.warning('As of Amplify CLI version 4.0');
  context.print.warning('A cloud project in the Amplify Console will be created to view your resources.');
  context.print.warning('Please update your IAM policy accordingly based on the following documentation:');
  context.print.green('https://docs.amplify.aws/cli/usage/iam');
  context.print.warning('These permissions will be required in a future CLI release.');
}

module.exports = {
  getConfiguredAmplifyClient,
  printAuthErrorMessage,
};
