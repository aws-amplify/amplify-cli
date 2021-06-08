import * as path from 'path';
import { SecretDeltas } from 'amplify-function-plugin-interface';
import { categoryName, functionParametersFileName } from '../utils/constants';
import { createParametersFile } from '../utils/storeResources';
import { getExistingSecrets } from './secretDeltaUtilities';
import { JSONUtilities, pathManager } from 'amplify-cli-core';

/**
 * Manages function secrets local state in function-parameters.json file.
 *
 * Specifically, it exports methods for reading and writing the "secretNames" array to function-parameters.json
 */

const secretsFuncParamsKey = 'secretNames';

export const getLocalFunctionSecretNames = async (functionName: string) => {
  const parametersFilePath = path.join(pathManager.getBackendDirPath(), categoryName, functionName, functionParametersFileName);
  const funcParameters = JSONUtilities.readJson<{ [secretsFuncParamsKey]: string[] }>(parametersFilePath, { throwIfNotExist: false });
  return funcParameters?.[secretsFuncParamsKey] || [];
};

export const setLocalFunctionSecretNames = async (functionName: string, secretDeltas: SecretDeltas) => {
  const secretsParametersContent = {
    [secretsFuncParamsKey]: Object.keys(getExistingSecrets(secretDeltas)),
  };
  createParametersFile(secretsParametersContent, functionName, functionParametersFileName);
};
