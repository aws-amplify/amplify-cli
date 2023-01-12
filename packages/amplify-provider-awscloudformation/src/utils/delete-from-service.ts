import { $TSContext, AmplifyFault, stateManager } from 'amplify-cli-core';
import type { SSM as SSMType } from 'aws-sdk';
import { SSM } from '../aws-utils/aws-ssm';
import { resolveAppId } from './resolve-appId';
import { getSsmSdkParametersDeleteMultiKeys } from './get-ssm-sdk-parameters';

/**
 * Higher order function for deleting CloudFormation parameters from the service
 */
export const getEnvParametersDeleteHandler = async (context: $TSContext, envName: string): Promise<(keys: Array<string>) => Promise<void>> => {
  const appId = resolveAppId(context);
  const { client } = await SSM.getInstance(context);
  return deleteParametersFromParameterStore(appId, envName, client);
};

const deleteParametersFromParameterStore = (
  appId: string,
  envName: string,
  ssmClient: SSMType,
): ((keys: Array<string>) => Promise<void>) => {
  return async (keys: Array<string>): Promise<void> => {
    try {
      const chunkedKeys = chunkForParameterStore(keys);
      await Promise.all(
        chunkedKeys.map(chunk => {
          const ssmArgument = getSsmSdkParametersDeleteMultiKeys(appId, envName, chunk);
          return ssmClient.deleteParameters(ssmArgument).promise();
        })
      );
    } catch (e) {
      throw new AmplifyFault(
        'ParametersDeleteFault',
        {
          message: `Failed to delete parameters from ParameterStore`,
        },
        e,
      );
    }
  };
};

// SSMS deleteParameters can only take up to 10 paramaters
function chunkForParameterStore(keys: Array<string>) {
  const maxLength = 10;
  const chunkedKeys: Array<Array<string>> = [];
  let lastChunk: Array<string> = [];
  chunkedKeys.push(lastChunk);
  keys.forEach(key => {
    if (lastChunk.length == maxLength) {
      lastChunk = [];
      chunkedKeys.push(lastChunk);
    }
    lastChunk.push(key);
  });
  return chunkedKeys;
}