import { $TSContext, AmplifyFault, stateManager } from '@aws-amplify/amplify-cli-core';
import { printer } from '@aws-amplify/amplify-prompts';
import { SSM } from '../../aws-utils/aws-ssm';
import { resolveAppId } from '../resolve-appId';
import { executeSdkPromisesWithExponentialBackOff } from './exp-backoff-executor';
import {
  GetParametersByPathResult,
  GetParametersCommand,
  GetParametersResult,
  PutParameterCommand,
  PutParameterCommandInput,
  SSMClient,
} from '@aws-sdk/client-ssm';

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
    printer.warn('Failed to resolve AppId, skipping parameter download.');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return (__: string, ___: string | boolean | number) =>
      new Promise((resolve) => {
        resolve();
      });
  }
  const envName = stateManager.getCurrentEnvName();
  const { client } = await SSM.getInstance(context);
  return uploadParameterToParameterStore(appId, envName, client);
};

const uploadParameterToParameterStore = (
  appId: string,
  envName: string,
  ssmClient: SSMClient,
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
      } as PutParameterCommandInput;
      await executeSdkPromisesWithExponentialBackOff([() => ssmClient.send(new PutParameterCommand(sdkParameters))]);
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

// some utility types for the functions below
export type PrimitiveRecord = Record<string, string | number | boolean>;
export type DownloadHandler = (keys: string[]) => Promise<PrimitiveRecord>;

/**
 * Higher order function for downloading CloudFormation parameters from the service
 */
export const getEnvParametersDownloadHandler = async (context: $TSContext): Promise<DownloadHandler> => {
  let appId: string;
  try {
    appId = resolveAppId(context);
  } catch {
    printer.warn('Failed to resolve AppId. Skipping parameter download.');
    // return a noop function
    return async () => ({});
  }
  const envName = stateManager.getCurrentEnvName() || context?.exeInfo?.inputParams?.amplify?.envName;
  if (!envName) {
    printer.warn('Failed to resolve environment name. Skipping parameter download.');
    return async () => ({});
  }
  const { client } = await SSM.getInstance(context);
  return downloadParametersFromParameterStore(appId, envName, client);
};

const downloadParametersFromParameterStore = (appId: string, envName: string, ssmClient: SSMClient): DownloadHandler => {
  return async (keys: string[]): Promise<PrimitiveRecord> => {
    if (keys.length === 0) {
      return {};
    }
    const keyPaths = keys.map((key) => `/amplify/${appId}/${envName}/${key}`);
    try {
      const sdkPromises = convertKeyPathsToSdkPromises(ssmClient, keyPaths);
      const results = await executeSdkPromisesWithExponentialBackOff<GetParametersResult>(sdkPromises);
      return results.reduce((acc, { Parameters }) => {
        Parameters.forEach((param) => {
          const [, , , , /* leading slash */ /* amplify */ /* appId */ /* envName */ key] = param.Name.split('/');
          acc[key] = JSON.parse(param.Value);
        });
        return acc;
      }, {} as PrimitiveRecord);
    } catch (e) {
      throw new AmplifyFault(
        'ParameterDownloadFault',
        {
          message: `Failed to download the following parameters from ParameterStore:\n  ${keyPaths.join('\n  ')}`,
        },
        e,
      );
    }
  };
};

const convertKeyPathsToSdkPromises = (ssmClient: SSMClient, keyPaths: string[]): (() => Promise<GetParametersByPathResult>)[] => {
  const sdkParameterChunks = [];
  for (let i = 0; i < keyPaths.length; i += 10) {
    sdkParameterChunks.push({
      Names: keyPaths.slice(i, Math.min(i + 10, keyPaths.length)),
      WithDecryption: false,
    });
  }
  return sdkParameterChunks.map((sdkParameters) => () => ssmClient.send(new GetParametersCommand(sdkParameters)));
};
