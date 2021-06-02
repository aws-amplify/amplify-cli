import { $TSContext } from 'amplify-cli-core';
import * as aws from 'aws-sdk';

export class SSMClientWrapper {
  private static instance: SSMClientWrapper;

  static getInstance = async (context: $TSContext) => {
    if (!SSMClientWrapper.instance) {
      SSMClientWrapper.instance = new SSMClientWrapper(await getSSMClient(context));
    }
    return SSMClientWrapper.instance;
  }

  private constructor(private readonly ssmClient: aws.SSM) { }

  getExistingSecretNamesByPath = async (secretPath: string) => {
    const result = await this.ssmClient.getParametersByPath({
      Path: secretPath,
      MaxResults: 100,
      ParameterFilters: [
        {
          Key: 'Type',
          Option: 'Equals',
          Values: ['SecureString'],
        }
      ]
    }).promise();
    return result.Parameters.map(param => param.Name);
  };

  setSecret = async (secretName: string, secretValue: string) => {
    await this.ssmClient.putParameter({
      Name: secretName,
      Value: secretValue,
      Type: 'SecureString',
      Overwrite: true,
    }).promise();
  };

  deleteSecret = async (secretName: string) => {
    await this.ssmClient.deleteParameter({
      Name: secretName,
    }).promise();
  }
}

const getSSMClient = async (context: $TSContext) => {
  const { client } = await context.amplify.invokePluginMethod(context, 'awscloudformation', undefined, 'getConfiguredSSMClient', []);
  return client as aws.SSM;
}