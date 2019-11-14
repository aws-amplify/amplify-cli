const aws = require('aws-sdk');
const proxyAgent = require('proxy-agent');
const configurationManager = require('../../lib/configuration-manager');

// const betaEndpoint = 'https://ntb76nklh1.execute-api.us-west-2.amazonaws.com/beta';
const gammaEndpoint = 'https://e3alza85jk.execute-api.us-west-2.amazonaws.com/gamma';

async function getConfiguredAmplifyClient(context, options = {}) {
  let cred = {};
  const httpProxy = process.env.HTTP_PROXY || process.env.HTTPS_PROXY;

  try {
    cred = await configurationManager.loadConfiguration(context);
  } catch (e) {
    // ignore missing config
  }

  let endpoint = gammaEndpoint;
  if (process.env.AWS_AMPLIFY_ENDPOINT) {
    endpoint = process.env.AWS_AMPLIFY_ENDPOINT;
  }

  const defaultOptions = {
    region: 'us-west-2',
    endpoint,
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
