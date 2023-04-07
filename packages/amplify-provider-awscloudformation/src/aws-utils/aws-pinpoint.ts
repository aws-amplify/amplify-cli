const aws = require('aws-sdk');
const { FeatureFlags } = require('@aws-amplify/amplify-cli-core');
const proxyAgent = require('proxy-agent');
const configurationManager = require('../configuration-manager');
const { formUserAgentParam } = require('./user-agent');

const defaultPinpointRegion = 'us-east-1';

export const getConfiguredPinpointClient = async (
  context: $TSContext,
  category: string,
  action?: string[],
  envName?: string,
): Promise<aws.Pinpoint> => {
  const httpProxy = process.env.HTTP_PROXY || process.env.HTTPS_PROXY;
  const cred = await getConfiguredCredentials(context, envName);

  category = category || 'missing';
  action = action || ['missing'];
  const userAgentAction = `${category}:${action[0]}`;
  const defaultOptions = {
    region: mapServiceRegion(cred?.region || configurationManager.resolveRegion()),
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
};

const mapServiceRegion = (region: string): string => {
  const serviceRegionMap = getPinpointRegionMapping();
  if (serviceRegionMap[region]) {
    return serviceRegionMap[region];
  }
  return defaultPinpointRegion;
};

export const getPinpointRegionMapping = (): { [key: string]: string } => {
  const latestPinpointRegions = FeatureFlags.getNumber('latestRegionSupport.pinpoint');

  return {
    'us-east-1': 'us-east-1',
    'us-east-2': latestPinpointRegions ? 'us-east-2' : 'us-east-1',
    'sa-east-1': 'us-east-1',
    'ca-central-1': latestPinpointRegions >= 1 ? 'ca-central-1' : 'us-east-1',
    'us-west-1': 'us-west-2',
    'us-west-2': 'us-west-2',
    'cn-north-1': 'us-west-2',
    'cn-northwest-1': 'us-west-2',
    'ap-south-1': latestPinpointRegions >= 1 ? 'ap-south-1' : 'us-east-1',
    'ap-northeast-3': 'us-west-2',
    'ap-northeast-2': latestPinpointRegions >= 1 ? 'ap-northeast-2' : 'us-east-1',
    'ap-southeast-1': latestPinpointRegions >= 1 ? 'ap-southeast-1' : 'us-east-1',
    'ap-southeast-2': latestPinpointRegions >= 1 ? 'ap-southeast-2' : 'us-east-1',
    'ap-northeast-1': latestPinpointRegions >= 1 ? 'ap-northeast-1' : 'us-east-1',
    'eu-central-1': 'eu-central-1',
    'eu-north-1': 'eu-central-1',
    'eu-south-1': 'eu-central-1',
    'eu-west-1': 'eu-west-1',
    'eu-west-2': latestPinpointRegions >= 1 ? 'eu-west-2' : 'eu-west-1',
    'eu-west-3': 'eu-west-1',
    'me-south-1': 'ap-south-1',
  };
};

const getConfiguredCredentials = async (context: $TSContext, envName: string): Promise<configurationManager.AwsSecrets | undefined> => {
  try {
    if (envName) {
      return configurationManager.loadConfigurationForEnv(context, envName);
    } else {
      return configurationManager.loadConfiguration(context);
    }
  } catch (e) {
    // ignore missing config
    return undefined;
  }
};
