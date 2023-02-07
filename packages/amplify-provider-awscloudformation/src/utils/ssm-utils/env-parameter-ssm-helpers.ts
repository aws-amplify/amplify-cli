import { $TSContext, AmplifyFault, stateManager } from 'amplify-cli-core';
import { printer } from 'amplify-prompts';
import type { SSM as SSMType } from 'aws-sdk';
import { SSM } from '../../aws-utils/aws-ssm';
import { resolveAppId } from '../resolve-appId';
import { executeSdkPromisesWithExponentialBackoff } from './exp-backoff-executor';

/**
 * Higher order function for uploading CloudFormation parameters to the service
 */
export const getEnvParametersUploadHandler = async (
  context: $TSContext,
): Promise<(key: string, value: string | boolean | number) => Promise<void>> => {
  let appId: string;
  try {
    appId = resolveAppId(context);
  } catch {
    return (key: string, value: string | boolean | number) => new Promise(() => {
      printer.warn('Failed to resolve AppId, skipping parameter upload.');
    });
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
): Promise<((keys: string[]) => Promise<Record<string, string | number | boolean>>)> => {
  let appId: string;
  try {
    appId = resolveAppId(context);
  } catch {
    return (__: string[]) => new Promise(() => {
      printer.warn('Failed to resolve AppId, skipping parameter download.');
    });
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
      const sdkPromises = convertKeyPathsToSdkPromises(ssmClient, keyPaths);
      const results = await executeSdkPromisesWithExponentialBackoff<SSMType.GetParametersResult>(sdkPromises);
      return results.reduce((acc, { Parameters }) => {
        Parameters.forEach((param) => {
          const [/* leading slash */, /* amplify */, /* appId */, /* envName */, key] = param.Name.split('/');
          acc[key] = JSON.parse(param.Value);
        });
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

const convertKeyPathsToSdkPromises = (ssmClient: SSMType, keyPaths: string[]): (() => Promise<SSMType.GetParametersByPathResult>)[] => {
  let parameterSliceIndex = 0;
  const sdkParameterChunks = [];
  for (let i = 0; i < keyPaths.length; i += 10) {
    sdkParameterChunks.push({
      Names: keyPaths.slice(parameterSliceIndex, Math.min(parameterSliceIndex + 10, keyPaths.length)),
      WithDecryption: false,
    });
  }
  return sdkParameterChunks.map((sdkParameters) => () => ssmClient.getParameters(sdkParameters).promise());
};
