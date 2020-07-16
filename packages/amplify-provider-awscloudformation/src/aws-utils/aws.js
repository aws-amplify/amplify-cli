const path = require('path');
const fs = require('fs-extra');
const os = require('os');

const dotAWSDirPath = path.normalize(path.join(os.homedir(), '.aws'));
const credentialsFilePath = path.join(dotAWSDirPath, 'credentials');
const configFilePath = path.join(dotAWSDirPath, 'config');

let aws;

try {
  delete require.cache[require.resolve('aws-sdk')];
  if (fs.existsSync(credentialsFilePath) && fs.existsSync(configFilePath)) {
    process.env.AWS_SDK_LOAD_CONFIG = true;
  } else {
    delete process.env.AWS_SDK_LOAD_CONFIG;
  }
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
