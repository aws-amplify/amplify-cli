import { $TSContext, stateManager } from 'amplify-cli-core';
import { categoryName } from '../constants';
import {
  FunctionSecretsStateManager,
  getLocalFunctionSecretNames,
  storeSecretsPendingRemoval,
} from '../provider-utils/awscloudformation/secrets/functionSecretsStateManager';
import { ensureEnvironmentVariableValues } from '../provider-utils/awscloudformation/utils/environmentVariablesHelper';

export const prePushHandler = async (context: $TSContext) => {
  await ensureEnvironmentVariableValues(context);
  await ensureFunctionSecrets(context);
};

const ensureFunctionSecrets = async (context: $TSContext) => {
  const amplifyMeta = stateManager.getMeta();
  const functionNames = Object.keys(amplifyMeta?.[categoryName]);
  for (const funcName of functionNames) {
    if (getLocalFunctionSecretNames(funcName).length > 0) {
      const funcSecretsManager = await FunctionSecretsStateManager.getInstance(context);
      await funcSecretsManager.ensureNewLocalSecretsSyncedToCloud(funcName);
    }
  }
  await storeSecretsPendingRemoval(context, functionNames);
};
