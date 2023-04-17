import { $TSContext } from '@aws-amplify/amplify-cli-core';
import type { SSM } from 'aws-sdk';

/**
 * Wrapper around SSM SDK calls
 */
export class SSMClientWrapper {
  private static instance: SSMClientWrapper;

  static getInstance = async (context: $TSContext): Promise<SSMClientWrapper> => {
    if (!SSMClientWrapper.instance) {
      SSMClientWrapper.instance = new SSMClientWrapper(await getSSMClient(context));
    }
    return SSMClientWrapper.instance;
  };

  private constructor(private readonly ssmClient: SSM) {}

  /**
   * Returns a list of secret name value pairs
   */
  getSecrets = async (secretNames: string[]): Promise<{ secretName?: string; secretValue?: string }[] | undefined> => {
    if (!secretNames || secretNames.length === 0) {
      return [];
    }
    const result = await this.ssmClient
      .getParameters({
        Names: secretNames,
        WithDecryption: true,
      })
      .promise();

    return result?.Parameters?.map(({ Name, Value }) => ({ secretName: Name, secretValue: Value }));
  };

  /**
   * Returns all secret names under a path. Does NOT decrypt any secrets
   */
  getSecretNamesByPath = async (secretPath: string): Promise<string[]> => {
    let NextToken;
    const accumulator: string[] = [];
    do {
      const result: SSM.GetParametersByPathResult = await this.ssmClient
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

      if (Array.isArray(result?.Parameters)) {
        accumulator.push(...result.Parameters.filter((param) => param?.Name !== undefined).map((param) => param.Name));
      }

      NextToken = result.NextToken;
    } while (NextToken);
    return accumulator;
  };

  /**
   * Sets the given secretName to the secretValue. If secretName is already present, it is overwritten.
   */
  setSecret = async (secretName: string, secretValue: string): Promise<void> => {
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
  deleteSecret = async (secretName: string): Promise<void> => {
    await this.ssmClient
      .deleteParameter({
        Name: secretName,
      })
      .promise()
      .catch((err) => {
        if (err.code !== 'ParameterNotFound') {
          // if the value didn't exist in the first place, consider it deleted
          throw err;
        }
      });
  };

  /**
   * Deletes all secrets in secretNames
   */
  deleteSecrets = async (secretNames: string[]): Promise<void> => {
    try {
      await this.ssmClient.deleteParameters({ Names: secretNames }).promise();
    } catch (err) {
      // if the value didn't exist in the first place, consider it deleted
      if (err.code !== 'ParameterNotFound') {
        throw err;
      }
    }
  };
}

const getSSMClient = async (context: $TSContext): Promise<SSM> => {
  const { client } = await context.amplify.invokePluginMethod<{ client: SSM }>(
    context,
    'awscloudformation',
    undefined,
    'getConfiguredSSMClient',
    [context],
  );

  return client;
};
