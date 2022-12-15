import { $TSContext, stateManager } from 'amplify-cli-core';
import { printer } from 'amplify-prompts';
import type { SSM as SSMType } from 'aws-sdk';
import { SSM } from '../aws-utils/aws-ssm';
import { resolveAppId } from './resolve-appId';

/**
 * Higher order function for uploading CloudFormation parameters to the service
 */
export const getEnvParametersUploadHandler = async (context: $TSContext): Promise<((key: string, value: string) => Promise<void>)> => {
  const appId = resolveAppId(context);
  const envName = stateManager.getCurrentEnvName();
  const { client } = await SSM.getInstance(context);
  return uploadParameterToParameterStore(appId, envName, client);
};

const uploadParameterToParameterStore = (
  appId: string,
  envName: string,
  ssmClient: SSMType,
): (key: string, value: string) => Promise<void> => {
  return async (key: string, value: string): Promise<void> => {
    try {
      const sdkParameters = {
        Name: `/amplify/${appId}/${envName}/${key}`,
        Value: value,
        Overwrite: true,
        Type: 'String',
      };
      await ssmClient.putParameter(sdkParameters).promise();
    } catch (e) {
      // TODO
      printer.error(`Failed to upload parameter: ${key}`);
      printer.error(`Reason: ${e?.message ?? e}`);
    }
  }
}
