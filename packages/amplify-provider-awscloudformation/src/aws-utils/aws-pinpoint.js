const aws = require('aws-sdk');
const { FeatureFlags } = require('amplify-cli-core');
const proxyAgent = require('proxy-agent');
const configurationManager = require('../configuration-manager');
const { formUserAgentParam } = require('./user-agent');

const defaultPinpointRegion = 'us-east-1';

async function getConfiguredPinpointClient(context, category, action, envName) {
  let cred = {};
  const httpProxy = process.env.HTTP_PROXY || process.env.HTTPS_PROXY;

  try {
    if (envName) {
      cred = await configurationManager.loadConfigurationForEnv(context, envName);
    } else {
      cred = await configurationManager.loadConfiguration(context);
    }
  } catch (e) {
    // ignore missing config
  }
  category = category || 'missing';
  action = action || ['missing'];
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

  return new aws.Pinpoint({ ...cred, ...defaultOptions });
}

function mapServiceRegion(region) {
  const serviceRegionMap = getPinpointRegionMapping();
  if (serviceRegionMap[region]) {
    return serviceRegionMap[region];
  }
  return defaultPinpointRegion;
}

function getPinpointRegionMapping() {
  const latestPinpointRegions = FeatureFlags.getNumber('latestRegionSupport.pinpoint');

  return {
    'us-east-1': 'us-east-1',
    'us-east-2': 'us-east-1',
    'sa-east-1': 'us-east-1',
    'ca-central-1': latestPinpointRegions >= 1 ? 'ca-central-1' : 'us-east-1',
    'us-west-1': 'us-west-2',
    'us-west-2': 'us-west-2',
    'cn-north-1': 'us-west-2',
    'cn-northwest-1': 'us-west-2',
    'ap-south-1': latestPinpointRegions >= 1 ? 'ap-south-1' : 'us-west-2',
    'ap-northeast-3': 'us-west-2',
    'ap-northeast-2': latestPinpointRegions >= 1 ? 'ap-northeast-2' : 'us-west-2',
    'ap-southeast-1': latestPinpointRegions >= 1 ? 'ap-southeast-1' : 'us-west-2',
    'ap-southeast-2': latestPinpointRegions >= 1 ? 'ap-southeast-2' : 'us-west-2',
    'ap-northeast-1': latestPinpointRegions >= 1 ? 'ap-northeast-1' : 'us-west-2',
    'eu-central-1': 'eu-central-1',
    'eu-north-1': 'eu-central-1',
    'eu-west-1': 'eu-west-1',
    'eu-west-2': latestPinpointRegions >= 1 ? 'eu-west-2' : 'eu-west-1',
    'eu-west-3': 'eu-west-1',
    'me-south-1': 'ap-south-1',
  };
}

module.exports = {
  getPinpointRegionMapping,
  getConfiguredPinpointClient,
};
