const aws = require('aws-sdk');
const proxyAgent = require('proxy-agent');
const configurationManager = require('../../lib/configuration-manager');

const amplifyServiceRegions = [
  'us-east-1',
  'us-east-2',
  'us-west-2',
  'eu-west-1',
  'eu-west-2',
  'eu-central-1',
  'ap-northeast-1',
  'ap-northeast-2',
  'ap-south-1',
  'ap-southeast-1',
  'ap-southeast-2',
];

async function getConfiguredAmplifyClient(context, options = {}) {
  let cred = {};
  let defaultOptions = {};
  const httpProxy = process.env.HTTP_PROXY || process.env.HTTPS_PROXY;
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

  if (httpProxy) {
    aws.config.update({
      httpOptions: {
        agent: proxyAgent(httpProxy),
      },
    });
  }

  const config = { ...cred, ...defaultOptions, ...options };

  if (config.region && amplifyServiceRegions.includes(config.region)) {
    return new aws.Amplify(config);
  }
  return undefined;
}

function printAuthErrorMessage(context) {
  context.print.warning('As of Amplify CLI version 4.0');
  context.print.warning('A cloud project in the Amplify Console will be created to view your resources.');
  context.print.warning('Please update your IAM policy accordingly based on the following doc.');
  context.print.green('https://aws-amplify.github.io/docs/cli-toolchain/usage#iam-policy-for-the-cli');
  context.print.warning('These permissions will be required in a future CLI release.');
}

module.exports = {
  getConfiguredAmplifyClient,
  printAuthErrorMessage,
};
