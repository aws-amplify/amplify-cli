const aws = require('aws-sdk');
const proxyAgent = require('proxy-agent');
const configurationManager = require('../../lib/configuration-manager');
const { formUserAgentParam } = require('./user-agent');

const defaultPinpointRegion = 'us-east-1';
const serviceRegionMap = {
  'us-east-1': 'us-east-1',
  'us-east-2': 'us-east-1',
  'sa-east-1': 'us-east-1',
  'ca-central-1': 'us-east-1',
  'us-west-1': 'us-west-2',
  'us-west-2': 'us-west-2',
  'cn-north-1': 'us-west-2',
  'cn-northwest-1': 'us-west-2',
  'ap-south-1': 'us-west-2',
  'ap-northeast-3': 'us-west-2',
  'ap-northeast-2': 'us-west-2',
  'ap-southeast-1': 'us-west-2',
  'ap-southeast-2': 'us-west-2',
  'ap-northeast-1': 'us-west-2',
  'eu-central-1': 'eu-central-1',
  'eu-west-1': 'eu-west-1',
  'eu-west-2': 'eu-west-1',
  'eu-west-3': 'eu-west-1',
};

async function getConfiguredPinpointClient(context, category, action, options = {}) {
  let cred = {};
  const httpProxy = process.env.HTTP_PROXY || process.env.HTTPS_PROXY;

  try {
    cred = await configurationManager.loadConfiguration(context);
  } catch (e) {
    // ignore missing config
  }
  category = category || 'missing';
  action = action || 'missing';
  const userAgentAction = `${category}:${action[0]}`;
  const defaultOptions = {
    region: mapServiceRegion(cred.region || configurationManager.resolveRegion()),
    customUserAgent: formUserAgentParam(context, userAgentAction),
  };

  if (httpProxy) {
    aws.config.update({
      httpOptions: {
        agent: proxyAgent(httpProxy),
      },
    });
  }

  return new aws.Pinpoint({ ...cred, ...defaultOptions, ...options });
}

function mapServiceRegion(region) {
  if (serviceRegionMap[region]) {
    return serviceRegionMap[region];
  }
  return defaultPinpointRegion;
}

function getPinpointRegionMapping() {
  return serviceRegionMap;
}

module.exports = {
  getPinpointRegionMapping,
  getConfiguredPinpointClient,
};
