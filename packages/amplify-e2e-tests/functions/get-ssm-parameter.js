const aws = require('aws-sdk');

exports.handler = async event => {
  const { secretName} = event;
  const { Parameter } = await new aws.SSM()
    .getParameter({
      Name: secretName,
      WithDecryption: true,
    })
    .promise();
  return Parameter;
};
