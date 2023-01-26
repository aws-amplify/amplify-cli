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
): Promise<((key: string, value: unknown) => Promise<void>) | undefined> => {
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
): ((key: string, value: unknown) => Promise<void>) => {
  return async (key: string, value: unknown): Promise<void> => {
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
