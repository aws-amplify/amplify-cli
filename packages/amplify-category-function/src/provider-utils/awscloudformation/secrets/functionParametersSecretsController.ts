import * as path from 'path';
import { SecretDeltas, SecretName } from 'amplify-function-plugin-interface';
import { categoryName, functionParametersFileName, ServiceName } from '../utils/constants';
import { createParametersFile } from '../utils/storeResources';
import { getExistingSecrets } from './secretDeltaUtilities';
import { $TSContext, JSONUtilities, pathManager, ResourceName } from 'amplify-cli-core';
import * as fs from 'fs-extra';

/**
 * Manages function secrets local state in function-parameters.json file.
 *
 * Specifically, it exports methods for reading and writing the "secretNames" array to function-parameters.json
 */

const secretsFuncParamsKey = 'secretNames';

export const defaultGetFunctionSecretNamesOptions = {
  fromCurrentCloudBackend: false,
};

export const getFunctionSecretNames = async (functionName: string, options = defaultGetFunctionSecretNamesOptions) => {
  options = { ...defaultGetFunctionSecretNamesOptions, ...options };
  const parametersFilePath = path.join(
    options.fromCurrentCloudBackend ? pathManager.getCurrentCloudBackendDirPath() : pathManager.getBackendDirPath(),
    categoryName,
    functionName,
    functionParametersFileName,
  );
  const funcParameters = JSONUtilities.readJson<{ [secretsFuncParamsKey]: string[] }>(parametersFilePath, { throwIfNotExist: false });
  return funcParameters?.[secretsFuncParamsKey] || [];
};

export const setLocalFunctionSecretNames = async (functionName: string, secretDeltas: SecretDeltas) => {
  const secretsParametersContent = {
    [secretsFuncParamsKey]: Object.keys(getExistingSecrets(secretDeltas)),
  };
  createParametersFile(secretsParametersContent, functionName, functionParametersFileName);
};

const removedFunctionsWithSecretsFilename = () => path.join(pathManager.getBackendDirPath(), '.removed-functions-with-secrets.json');

/**
 * When a secret is removed, it must be removed after the corresponding CFN push is complete.
 * However, once the push is complete, the local project state has no way of knowing what functions were just removed or if they had secrets configured.
 * So this function can be called during prePush and will write the secretNames of to-be-deleted functions to a temporary file.
 * It also registers an on exit listener to ensure the file is cleaned up
 */
export const tempStoreToBeRemovedFunctionsWithSecrets = async (context: $TSContext) => {
  const resourcesToBeDeleted = ((await context.amplify.getResourceStatus())?.resourcesToBeDeleted || []) as {
    category: string;
    resourceName: string;
    service: string;
  }[];
  const deletedLambdas = resourcesToBeDeleted.filter(
    resource => resource.category === categoryName && resource.service === ServiceName.LambdaFunction,
  );
  const deletedSecretsMeta: Record<ResourceName, SecretName[]> = {};
  for (const deletedLambda of deletedLambdas) {
    const secretNames = await getFunctionSecretNames(deletedLambda.resourceName, { fromCurrentCloudBackend: true });
    if (secretNames.length) {
      deletedSecretsMeta[deletedLambda.resourceName] = secretNames;
    }
  }
  JSONUtilities.writeJson(removedFunctionsWithSecretsFilename(), deletedSecretsMeta);
  process.on('exit', () => {
    try {
      fs.unlinkSync(removedFunctionsWithSecretsFilename());
    } catch {
      // do nothing
    }
  });
};

export const getRemovedFunctionsWithSecrets = () =>
  JSONUtilities.readJson<Record<ResourceName, SecretName[]>>(removedFunctionsWithSecretsFilename(), { throwIfNotExist: false }) || {};
