import { $TSContext, AmplifyFault, stateManager } from 'amplify-cli-core';
import { printer } from 'amplify-prompts';
import type { SSM as SSMType } from 'aws-sdk';
import { SSM } from '../aws-utils/aws-ssm';
import { resolveAppId } from './resolve-appId';

/**
 * Higher order function for uploading CloudFormation parameters to the service
 */
export const getEnvParametersUploadHandler = async (
  context: $TSContext,
): Promise<((key: string, value: string | boolean | number) => Promise<void>) | undefined> => {
  let appId: string;
  try {
    appId = resolveAppId(context);
  } catch {
    printer.warn('Failed to resolve AppId, skipping parameter upload');
    return undefined;
  }
  const envName = stateManager.getCurrentEnvName();
  const { client } = await SSM.getInstance(context);
  return uploadParameterToParameterStore(appId, envName, client);
};

const uploadParameterToParameterStore = (
  appId: string,
  envName: string,
  ssmClient: SSMType,
): ((key: string, value: string | boolean | number) => Promise<void>) => {
  return async (key: string, value: string | boolean | number): Promise<void> => {
    try {
      const stringValue: string = JSON.stringify(value);
      const sdkParameters = {
        Name: `/amplify/${appId}/${envName}/${key}`,
        Overwrite: true,
        Tier: 'Standard',
        Type: 'String',
        Value: stringValue,
      };
      await ssmClient.putParameter(sdkParameters).promise();
    } catch (e) {
      throw new AmplifyFault(
        'ParameterUploadFault',
        {
          message: `Failed to upload ${key} to ParameterStore`,
        },
        e,
      );
    }
  };
};

/**
 * Higher order function for uploading CloudFormation parameters to the service
 */
export const getEnvParametersDownloadHandler = async (
  context: $TSContext,
): Promise<((keys: string[]) => Promise<Record<string, string | number | boolean>>) | undefined> => {
  let appId: string;
  try {
    appId = resolveAppId(context);
  } catch {
    printer.warn('Failed to resolve AppId, skipping parameter upload');
    return undefined;
  }
  const envName = stateManager.getCurrentEnvName();
  const { client } = await SSM.getInstance(context);
  return downloadParametersFromParameterStore(appId, envName, client);
};

const downloadParametersFromParameterStore = (
  appId: string,
  envName: string,
  ssmClient: SSMType,
): ((keys: string[]) => Promise<Record<string, string | number | boolean>>) => {
  return async (keys: string[]): Promise<Record<string, string | number | boolean>> => {
    if (keys.length === 0) {
      return {};
    }
    try {
      const keyPaths = keys.map(key => `/amplify/${appId}/${envName}/${key}`);
      const results = await paginatedSSMSdkCallWithExponentialBackoff(keyPaths, ssmClient);
      return results.reduce((acc, param) => {
        const [/* leading slash */, /* amplify */, /* appId */, /* envName */, key] = param.Name.split('/');
        acc[key] = JSON.parse(param.Value);
        return acc;
      }, {} as Record<string, string | number | boolean>);
    } catch (e) {
      throw new AmplifyFault(
        'ParameterDownloadFault',
        {
          message: `Failed to download the following parameters from ParameterStore:\n  ${keys.join('\n  ')}`,
        },
        e,
      );
    }
  };
};

const paginatedSSMSdkCallWithExponentialBackoff = async (
  keyPaths: string[],
  ssmClient: SSMType,
): Promise<SSMType.Parameter[]> => {
  let backoffSleepTimeInMs = 200;
  let consecutiveRetries = 0;
  const MAX_RETRIES = 5;
  const MAX_BACKOFF_IN_MS = 10 * 1000; // 10 seconds

  let parameterSliceIndex = 0;
  let retrievedParameterResults = [];
  while (parameterSliceIndex < keyPaths.length) {
    const sdkParameters = {
      Names: keyPaths.slice(parameterSliceIndex, Math.min(parameterSliceIndex + 10, keyPaths.length)),
      WithDecryption: false,
    };
    try {
      const { Parameters } = await ssmClient.getParameters(sdkParameters).promise();
      retrievedParameterResults = retrievedParameterResults.concat(Parameters);
      parameterSliceIndex += 10;
      // In case previously throttled, reset backoff
      backoffSleepTimeInMs = 200;
      consecutiveRetries = 0;
    } catch (e) {
      if (e?.type === 'ThrottlingException') {
        if (consecutiveRetries < MAX_RETRIES) {
          ++consecutiveRetries;
          await new Promise(resolve => setTimeout(resolve, backoffSleepTimeInMs));
          backoffSleepTimeInMs = 2 ** consecutiveRetries * backoffSleepTimeInMs;
          backoffSleepTimeInMs = Math.min(Math.random() * backoffSleepTimeInMs, MAX_BACKOFF_IN_MS);
          continue;
        }
      }
      throw e;
    }
  }

  return retrievedParameterResults;
};
