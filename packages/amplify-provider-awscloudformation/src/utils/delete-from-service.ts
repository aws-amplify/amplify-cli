import { $TSContext, AmplifyFault } from 'amplify-cli-core';
import type { SSM as SSMType } from 'aws-sdk';
import { SSM } from '../aws-utils/aws-ssm';
import { resolveAppId } from './resolve-appId';
import { getSsmSdkParametersDeleteParameters, getSsmSdkParametersGetParametersByPath } from './get-ssm-sdk-parameters';

/**
 * Delete CloudFormation parameters from the service
 */
export const deleteEnvironmentParametersFromService = async (context: $TSContext, envName: string): Promise<void> => {
  const appId = resolveAppId(context);
  const { client } = await SSM.getInstance(context);
  await deleteParametersFromParameterStore(appId, envName, client);
};

const deleteParametersFromParameterStore = async (appId: string, envName: string, ssmClient: SSMType): Promise<void> => {
    try {
      const envKeysInParameterStore: Array<string> = await getAllEnvParametersFromParameterStore(appId, envName, ssmClient);
      const chunkedKeys: Array<Array<string>> = chunkForParameterStore(envKeysInParameterStore);
      await Promise.all(
        chunkedKeys.map(chunk => {
          const ssmArgument = getSsmSdkParametersDeleteParameters(appId, envName, chunk);
          return ssmClient.deleteParameters(ssmArgument).promise();
        }),
      );
    } catch (e) {
      throw new AmplifyFault(
        'ParametersDeleteFault',
        {
          message: `Failed to delete parameters from the service`,
        },
        e,
      );
    }
};

const getAllEnvParametersFromParameterStore = async (appId: string, envName: string, ssmClient: SSMType): Promise<Array<string>> => {
  const parametersUnderPath: Array<string> = [];
  let recievedNextToken = '';
  do {
    const ssmArgument = getSsmSdkParametersGetParametersByPath(appId, envName, recievedNextToken);
    const data = await ssmClient.getParametersByPath(ssmArgument).promise();
    parametersUnderPath.push(...data.Parameters.map(returnedParameter => returnedParameter.Name));
    recievedNextToken = data.NextToken;
  } while (recievedNextToken);
  return parametersUnderPath;
};

const chunkForParameterStore = (keys: Array<string>): Array<Array<string>> => {
  const maxLength = 10;
  const chunkedKeys: Array<Array<string>> = [];
  let lastChunk: Array<string> = [];
  chunkedKeys.push(lastChunk);
  keys.forEach(key => {
    if (lastChunk.length === maxLength) {
      lastChunk = [];
      chunkedKeys.push(lastChunk);
    }
    lastChunk.push(key);
  });
  return chunkedKeys;
};
