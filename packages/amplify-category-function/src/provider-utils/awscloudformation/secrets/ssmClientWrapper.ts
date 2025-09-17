import { $TSContext } from '@aws-amplify/amplify-cli-core';
import {
  SSMClient,
  GetParametersCommand,
  GetParametersByPathCommand,
  PutParameterCommand,
  DeleteParameterCommand,
  DeleteParametersCommand,
} from '@aws-sdk/client-ssm';

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

  private constructor(private readonly ssmClient: SSMClient) {}

  /**
   * Returns a list of secret name value pairs
   */
  getSecrets = async (secretNames: string[]): Promise<{ secretName?: string; secretValue?: string }[] | undefined> => {
    if (!secretNames || secretNames.length === 0) {
      return [];
    }
    const result = await this.ssmClient.send(
      new GetParametersCommand({
        Names: secretNames,
        WithDecryption: true,
      }),
    );

    return result?.Parameters?.map(({ Name, Value }) => ({ secretName: Name, secretValue: Value }));
  };

  /**
   * Returns all secret names under a path. Does NOT decrypt any secrets
   */
  getSecretNamesByPath = async (secretPath: string): Promise<string[]> => {
    let NextToken;
    const accumulator: string[] = [];
    do {
      const result = await this.ssmClient.send(
        new GetParametersByPathCommand({
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
        }),
      );

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
    await this.ssmClient.send(
      new PutParameterCommand({
        Name: secretName,
        Value: secretValue,
        Type: 'SecureString',
        Overwrite: true,
      }),
    );
  };

  /**
   * Deletes secretName. If it already doesn't exist, this is treated as success. All other errors will throw.
   */
  deleteSecret = async (secretName: string): Promise<void> => {
    try {
      await this.ssmClient.send(
        new DeleteParameterCommand({
          Name: secretName,
        }),
      );
    } catch (err) {
      if (err.name !== 'ParameterNotFound') {
        // if the value didn't exist in the first place, consider it deleted
        throw err;
      }
    }
  };

  /**
   * Deletes all secrets in secretNames
   */
  deleteSecrets = async (secretNames: string[]): Promise<void> => {
    try {
      await this.ssmClient.send(new DeleteParametersCommand({ Names: secretNames }));
    } catch (err) {
      // if the value didn't exist in the first place, consider it deleted
      if (err.name !== 'ParameterNotFound') {
        throw err;
      }
    }
  };
}

const getSSMClient = async (context: $TSContext): Promise<SSMClient> => {
  const { client } = await context.amplify.invokePluginMethod<{ client: SSMClient }>(
    context,
    'awscloudformation',
    undefined,
    'getConfiguredSSMClient',
    [context],
  );

  return client;
};
