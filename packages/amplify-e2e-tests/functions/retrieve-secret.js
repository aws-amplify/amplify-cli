const aws = require('aws-sdk');

exports.handler = async event => {
  const { secretNames } = event;
  const { Parameters } = await new aws.SSM()
    .getParameters({
      Names: secretNames.map(secretName => process.env[secretName]),
      WithDecryption: true,
    })
    .promise();
  return Parameters;
};
