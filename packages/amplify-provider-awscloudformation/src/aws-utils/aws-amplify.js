const aws = require('aws-sdk');
const proxyAgent = require('proxy-agent');
const configurationManager = require('../../lib/configuration-manager');

const defaultAmplifyRegion = 'us-west-2';
const serviceRegionMap = {
  'us-east-1': 'us-east-1',
  'us-east-2': 'us-east-2',
  'sa-east-1': 'us-east-1',
  'ca-central-1': 'us-east-1',
  'us-west-1': 'us-west-2',
  'us-west-2': 'us-west-2',
  'cn-north-1': 'us-west-2',
  'cn-northwest-1': 'us-west-2',
  'ap-south-1': 'ap-south-1',
  'ap-northeast-3': 'us-west-2',
  'ap-northeast-2': 'ap-northeast-2',
  'ap-southeast-1': 'ap-southeast-1',
  'ap-southeast-2': 'ap-southeast-2',
  'ap-northeast-1': 'ap-northeast-1',
  'eu-central-1': 'eu-central-1',
  'eu-west-1': 'eu-west-1',
  'eu-west-2': 'eu-west-2',
  'eu-west-3': 'eu-west-1',
};

function mapServiceRegion(region) {
  if (serviceRegionMap[region]) {
    return serviceRegionMap[region];
  }
  return defaultAmplifyRegion;
}

async function getConfiguredAmplifyClient(context, options = {}) {
  let cred = {};
  const httpProxy = process.env.HTTP_PROXY || process.env.HTTPS_PROXY;

  try {
    cred = await configurationManager.loadConfiguration(context);
  } catch (e) {
    // ignore missing config
  }

  const defaultOptions = {
    region: mapServiceRegion(cred.region || configurationManager.resolveRegion()),
    endpoint: process.env.AWS_AMPLIFY_ENDPOINT,
  };

  if (httpProxy) {
    aws.config.update({
      httpOptions: {
        agent: proxyAgent(httpProxy),
      },
    });
  }

  return new aws.Amplify({ ...cred, ...defaultOptions, ...options });
}

module.exports = {
  getConfiguredAmplifyClient,
};
