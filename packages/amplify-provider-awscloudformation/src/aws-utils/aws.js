process.env.AWS_SDK_LOAD_CONFIG = true;
const aws = require('aws-sdk');
const configurationManager = require('../../lib/configuration-manager');

aws.loadConfig = async (context, envName) => {
  await configurationManager.loadConfiguration(context, aws, envName);
};

module.exports = aws;
