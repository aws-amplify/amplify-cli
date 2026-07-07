const { GetParameterCommand, SSMClient } = require('@aws-sdk/client-ssm');

exports.handler = async (event) => {
  const { secretName } = event;
  const ssmClient = new SSMClient({ region: process.env.AWS_REGION });
  const { Parameter } = await ssmClient.send(
    new GetParameterCommand({
      Name: secretName,
      WithDecryption: true,
    }),
  );
  return Parameter;
};
