import { $TSContext, AmplifyFault, IAmplifyResource } from '@aws-amplify/amplify-cli-core';
import { printer } from '@aws-amplify/amplify-prompts';
import { SSM } from '../../aws-utils/aws-ssm';
import { resolveAppId } from '../resolve-appId';
import { executeSdkPromisesWithExponentialBackOff } from './exp-backoff-executor';
import { getSsmSdkParametersDeleteParameters, getSsmSdkParametersGetParametersByPath } from './get-ssm-sdk-parameters';
import { DeleteParametersCommand, DeleteParametersResult, GetParametersByPathCommand, SSMClient } from '@aws-sdk/client-ssm';

/**
 * Delete all CloudFormation parameters from the service for a given environment
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
  const envKeysInParameterStore = await getAllEnvParametersFromParameterStore(appId, envName, client);
  await deleteParametersFromParameterStore(client, envKeysInParameterStore);
};

/**
 * Delete CloudFormation parameters from the service for an array of resources
 */
export const deleteEnvironmentParametersForResources = async (
  context: $TSContext,
  envName: string,
  resources: IAmplifyResource[],
): Promise<void> => {
  if (resources.length === 0) {
    return;
  }
  let appId;
  try {
    appId = resolveAppId(context);
  } catch {
    printer.debug(`No AppId found when deleting parameters for environment ${envName}`);
    return;
  }
  const { client } = await SSM.getInstance(context);
  const envKeysInParameterStore = await getAllEnvParametersFromParameterStore(appId, envName, client);
  const removedParameterKeys = envKeysInParameterStore.filter((key: string) => {
    const keyAfterPaths = key.split('/').pop();
    const [, categoryName, resourceName] = keyAfterPaths.split('_');
    for (const resource of resources) {
      if (resource.category === categoryName && resource.resourceName === resourceName) {
        return true;
      }
    }
    return false;
  });
  await deleteParametersFromParameterStore(client, removedParameterKeys);
};

const deleteParametersFromParameterStore = async (ssmClient: SSMClient, parameterKeys: string[]): Promise<void> => {
  if (parameterKeys.length === 0) {
    return;
  }
  try {
    const chunkedKeys = chunkForParameterStore(parameterKeys);
    const deleteKeysFromPSPromises = chunkedKeys.map((keys) => {
      const ssmArgument = getSsmSdkParametersDeleteParameters(keys);
      return () => ssmClient.send(new DeleteParametersCommand(ssmArgument));
    });

    await executeSdkPromisesWithExponentialBackOff<DeleteParametersResult>(deleteKeysFromPSPromises);
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

const getAllEnvParametersFromParameterStore = async (appId: string, envName: string, ssmClient: SSMClient): Promise<Array<string>> => {
  const parametersUnderPath: Array<string> = [];
  let receivedNextToken = '';
  do {
    const ssmArgument = getSsmSdkParametersGetParametersByPath(appId, envName, receivedNextToken);
    const [data] = await executeSdkPromisesWithExponentialBackOff([() => ssmClient.send(new GetParametersByPathCommand(ssmArgument))]);
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
