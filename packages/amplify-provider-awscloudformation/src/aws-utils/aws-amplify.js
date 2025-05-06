const aws = require('aws-sdk');
// const { ProxyAgent } = require('proxy-agent');
const configurationManager = require('../configuration-manager');
const { regions: amplifyServiceRegions } = require('../aws-regions');
const { proxyAgent } = require('./aws-globals');

async function getConfiguredAmplifyClient(context, options = {}) {
  let cred = {};
  let defaultOptions = {};
  // const httpProxy = process.env.HTTP_PROXY || process.env.HTTPS_PROXY;
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

  // **affected by SDK migrations
  // if (httpProxy) {
  //   aws.config.update({
  //     httpOptions: {
  //       agent: new ProxyAgent(),
  //     },
  //   });
  // }

  const config = {
    ...cred,
    ...defaultOptions,
    ...options,
    httpOptions: {
      agent: proxyAgent(),
    },
  };

  // this is the "project" config level case, creds and region are explicitly set or retrieved from a profile
  if (config.region) {
    if (amplifyServiceRegions.includes(config.region)) {
      return new aws.Amplify(config);
    }
    return undefined;
  }
  // this is the "general" config level case, aws sdk will resolve creds and region from env variables etc.
  return new aws.Amplify(config);
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
