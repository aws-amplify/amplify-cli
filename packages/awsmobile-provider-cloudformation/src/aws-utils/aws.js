const aws = require('aws-sdk');

// AWS promise with configuration through Odin
aws.configureWithCreds = context => new Promise((resolve) => {
  resolve(withDefaultConfiguration(aws, context));
});

function withDefaultConfiguration(awsModel) {
  // Fetch access key, secret key and region from context based on provider
  // Part of init/config
  const creds = {
    accessKey: 'AKIAI5LD6XA6YBWCTR2Q',
    secretKey: '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',
    region: 'us-east-1',
  };
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
