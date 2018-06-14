const aws = require('aws-sdk');
const configurationManager = require('../../lib/configuration-manager');

// AWS promise with configuration through Odin
aws.configureWithCreds = context => new Promise((resolve) => {
  resolve(withDefaultConfiguration(aws, context));
});

function withDefaultConfiguration(aws, context) {
  // Fetch access key, secret key and region from context based on provider
  // Part of init/config
  const creds = configurationManager.getConfiguration(context)
  return setAWSConfig(awsModel, creds.accessKey, creds.secretKey, creds.region);
}

function setAWSConfig(awsModel, access, secret, region) {
  awsModel.config.update({
    region,
    accessKeyId: access,
    secretAccessKey: secret,
  });
  awsModel.config.setPromisesDependency(Promise);
  return awsModel;
}


module.exports = aws;
