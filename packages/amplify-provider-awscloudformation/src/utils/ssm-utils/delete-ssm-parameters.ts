import { $TSContext, AmplifyFault } from '@aws-amplify/amplify-cli-core';
import { printer } from '@aws-amplify/amplify-prompts';
import type { SSM as SSMType } from 'aws-sdk';
import { SSM } from '../../aws-utils/aws-ssm';
import { resolveAppId } from '../resolve-appId';
import { executeSdkPromisesWithExponentialBackOff } from './exp-backoff-executor';
import { getSsmSdkParametersDeleteParameters, getSsmSdkParametersGetParametersByPath } from './get-ssm-sdk-parameters';

/**
 * Delete CloudFormation parameters from the service
 */
export const deleteEnvironmentParametersFromService = async (context: $TSContext, envName: string): Promise<void> => {
  let appId;
  try {
    appId = resolveAppId(context);
  } catch {
    printer.debug(`No AppId found when deleting parameters for environment ${envName}`);
    return;
  }
  const { client } = await SSM.getInstance(context);
  await deleteParametersFromParameterStore(appId, envName, client);
};

const deleteParametersFromParameterStore = async (appId: string, envName: string, ssmClient: SSMType): Promise<void> => {
  try {
    const envKeysInParameterStore: Array<string> = await getAllEnvParametersFromParameterStore(appId, envName, ssmClient);
    if (!envKeysInParameterStore.length) {
      return;
    }
    const chunkedKeys: Array<Array<string>> = chunkForParameterStore(envKeysInParameterStore);
    const deleteKeysFromPSPromises = chunkedKeys.map((keys) => {
      const ssmArgument = getSsmSdkParametersDeleteParameters(keys);
      return () => ssmClient.deleteParameters(ssmArgument).promise();
    });

    await executeSdkPromisesWithExponentialBackOff<SSMType.DeleteParametersResult>(deleteKeysFromPSPromises);
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

function isAmplifyParameter(parameter: string) {
  const keyPrefix = 'AMPLIFY_';
  const splitParam = parameter.split('/');
  const lastPartOfPath = splitParam.slice(-1).pop();
  return lastPartOfPath.startsWith(keyPrefix);
}

const getAllEnvParametersFromParameterStore = async (appId: string, envName: string, ssmClient: SSMType): Promise<Array<string>> => {
  const parametersUnderPath: Array<string> = [];
  let receivedNextToken = '';
  do {
    const ssmArgument = getSsmSdkParametersGetParametersByPath(appId, envName, receivedNextToken);
    const [data] = await executeSdkPromisesWithExponentialBackOff([() => ssmClient.getParametersByPath(ssmArgument).promise()]);
    parametersUnderPath.push(
      ...data.Parameters.map((returnedParameter) => returnedParameter.Name).filter((name) => isAmplifyParameter(name)),
    );
    receivedNextToken = data.NextToken;
  } while (receivedNextToken);
  return parametersUnderPath;
};

const chunkForParameterStore = (keys: Array<string>): Array<Array<string>> => {
  const maxLength = 10;
  const chunkedKeys: Array<Array<string>> = [];
  let lastChunk: Array<string> = [];
  chunkedKeys.push(lastChunk);
  keys.forEach((key) => {
    if (lastChunk.length === maxLength) {
      lastChunk = [];
      chunkedKeys.push(lastChunk);
    }
    lastChunk.push(key);
  });
  return chunkedKeys;
};
