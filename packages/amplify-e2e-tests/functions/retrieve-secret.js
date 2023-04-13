const { GetParametersCommand, SSMClient } = require('@aws-sdk/client-ssm');

exports.handler = async (event) => {
  const { secretNames } = event;
  const ssmClient = new SSMClient({ region: process.env.AWS_REGION });
  const { Parameters } = await ssmClient.send(
    new GetParametersCommand({
      Names: secretNames.map((secretName) => process.env[secretName]),
      WithDecryption: true,
    }),
  );
  return Parameters;
};
