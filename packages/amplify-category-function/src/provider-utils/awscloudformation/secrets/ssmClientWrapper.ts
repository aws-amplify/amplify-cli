import { $TSContext } from 'amplify-cli-core';
import { SecretName } from 'amplify-function-plugin-interface';
import * as aws from 'aws-sdk';
import ora from 'ora';
import { secretNamesToSecretDeltas } from './secretDeltaUtilities';

export class SSMClientWrapper {
  private static instance: SSMClientWrapper;

  static getInstance = async (context: $TSContext) => {
    if (!SSMClientWrapper.instance) {
      SSMClientWrapper.instance = new SSMClientWrapper(await getSSMClient(context));
    }
    return SSMClientWrapper.instance;
  };

  private constructor(private readonly ssmClient: aws.SSM) {}

  /**
   * Returns a Map of secretNames to secret values
   */
  getSecrets = async (secretNames: string[]) => {
    const accumulator = new Map<SecretName, string>();
    const result = await this.ssmClient
      .getParameters({
        Names: secretNames,
        WithDecryption: true,
      })
      .promise();

    result.Parameters.forEach(param => accumulator.set(param.Name, param.Value));
    return accumulator;
  };

  /**
   * Returns all secret names under a path. Does NOT decrypt any secrets
   */
  getSecretNamesByPath = async (secretPath: string) => {
    let NextToken;
    const accumulator: string[] = [];
    do {
      const result = await this.ssmClient
        .getParametersByPath({
          Path: secretPath,
          MaxResults: 10,
          ParameterFilters: [
            {
              Key: 'Type',
              Option: 'Equals',
              Values: ['SecureString'],
            },
          ],
          NextToken,
        })
        .promise();
      accumulator.push(...result.Parameters.map(param => param.Name));
      NextToken = result.NextToken;
    } while (NextToken);
    return accumulator;
  };

  /**
   * Sets the given secretName to the secretValue. If secretName is already present, it is overwritten.
   */
  setSecret = async (secretName: string, secretValue: string) => {
    await this.ssmClient
      .putParameter({
        Name: secretName,
        Value: secretValue,
        Type: 'SecureString',
        Overwrite: true,
      })
      .promise();
  };

  /**
   * Deletes secretName. If it already doesn't exist, this is treated as success. All other errors will throw.
   */
  deleteSecret = async (secretName: string) => {
    await this.ssmClient
      .deleteParameter({
        Name: secretName,
      })
      .promise()
      .catch(err => {
        if (err.code !== 'ParameterNotFound') {
          // if the value didn't exist in the first place, consider it deleted
          throw err;
        }
      });
  };
}

const getSSMClient = async (context: $TSContext) => {
  const spinner = ora('Initializing SSM Client');
  spinner.start();
  const { client } = await context.amplify.invokePluginMethod(context, 'awscloudformation', undefined, 'getConfiguredSSMClient', [context]);
  spinner.stop();
  return client as aws.SSM;
};
