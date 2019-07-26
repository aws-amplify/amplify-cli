process.env.AWS_SDK_LOAD_CONFIG = true;
const aws = require('aws-sdk');
const proxyAgent = require('proxy-agent');
const configurationManager = require('../../lib/configuration-manager');

aws.configureWithCreds = async (context) => {
  const httpProxy = process.env.HTTP_PROXY || process.env.HTTPS_PROXY;

  const config = await configurationManager.loadConfiguration(context, aws);
  if (config) {
    aws.config.update(config);
  }

  if (httpProxy) {
    awsConfig = {
      ...awsConfig,
      httpOptions: {
        agent: proxyAgent(httpProxy),
        rejectUnauthorized: context.ignoreSSL,
      },
    };
  }

  return aws;
};

module.exports = aws;
