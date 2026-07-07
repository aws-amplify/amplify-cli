import { $TSContext } from '@aws-amplify/amplify-cli-core';
import {
  DeleteParameterCommand,
  DeleteParametersCommand,
  GetParametersByPathCommand,
  GetParametersByPathResult,
  GetParametersCommand,
  PutParameterCommand,
  SSMClient,
} from '@aws-sdk/client-ssm';

/**
 * Executes an async operation with exponential backoff retry on throttling exceptions.
 */
const executeWithExponentialBackOff = async <T>(operation: () => Promise<T>): Promise<T> => {
  const MAX_RETRIES = 8;
  const MAX_BACK_OFF_IN_MS = 10 * 1000; // 10 seconds
  const MIN_BACK_OFF_IN_MS = 1000; // 1 second
  let backOffSleepTimeInMs = 500;
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await operation();
    } catch (e) {
      lastError = e;
      if ((e?.name === 'ThrottlingException' || e?.name === 'Throttling') && attempt < MAX_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, backOffSleepTimeInMs));
        backOffSleepTimeInMs = 2 ** (attempt + 1) * backOffSleepTimeInMs;
        backOffSleepTimeInMs = Math.max(Math.min(Math.random() * backOffSleepTimeInMs, MAX_BACK_OFF_IN_MS), MIN_BACK_OFF_IN_MS);
        continue;
      }
      throw e;
    }
  }
  throw lastError;
};

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
      const result: GetParametersByPathResult = await executeWithExponentialBackOff(() =>
        this.ssmClient.send(
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
        ),
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
