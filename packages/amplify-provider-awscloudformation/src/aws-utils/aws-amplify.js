const aws = require('aws-sdk');
const proxyAgent = require('proxy-agent');
const configurationManager = require('../../lib/configuration-manager');

async function getConfiguredAmplifyClient(context, options = {}) {
  let cred = {};
  const httpProxy = process.env.HTTP_PROXY || process.env.HTTPS_PROXY;

  try {
    cred = await configurationManager.loadConfiguration(context);
  } catch (e) {
    // ignore missing config
  }

  const defaultOptions = {
    region: 'us-west-2',
    endpoint: 'https://ntb76nklh1.execute-api.us-west-2.amazonaws.com/beta',
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
