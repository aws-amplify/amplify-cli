process.env.AWS_SDK_LOAD_CONFIG = true;
const aws = require('aws-sdk');
const configurationManager = require('../../lib/configuration-manager');

aws.configureWithCreds = async (context) => {
  const config = await configurationManager.loadConfiguration(context, aws);
  aws.config.update(config);
  return aws;
};

module.exports = aws;
