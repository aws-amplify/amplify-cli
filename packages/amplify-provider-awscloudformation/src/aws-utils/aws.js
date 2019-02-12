process.env.AWS_SDK_LOAD_CONFIG = true;
const aws = require('aws-sdk');
const configurationManager = require('../../lib/configuration-manager');

aws.configureWithCreds = context => configurationManager.loadConfiguration(context, aws);

const httpProxy = process.env.HTTP_PROXY || process.env.HTTPS_PROXY;

if (httpProxy) {
  const proxyAgent = require('proxy-agent');
  aws.config.update({
    httpOptions: {
      agent: proxyAgent(httpProxy)
    }
  });
}

module.exports = aws;
