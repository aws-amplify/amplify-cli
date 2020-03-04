let aws;

try {
  delete require.cache[require.resolve('aws-sdk')];
  process.env.AWS_SDK_LOAD_CONFIG = true;
  aws = require('aws-sdk');
} catch (e) {
  delete require.cache[require.resolve('aws-sdk')];
  delete process.env.AWS_SDK_LOAD_CONFIG;
  aws = require('aws-sdk');
}

const proxyAgent = require('proxy-agent');
const configurationManager = require('../../lib/configuration-manager');

aws.configureWithCreds = async context => {
  const httpProxy = process.env.HTTP_PROXY || process.env.HTTPS_PROXY;
  const config = await configurationManager.loadConfiguration(context, aws);
  if (config) {
    aws.config.update(config);
  }

  if (httpProxy) {
    aws.config.update({
      httpOptions: {
        agent: proxyAgent(httpProxy),
      },
    });
  }

  return aws;
};

module.exports = aws;
