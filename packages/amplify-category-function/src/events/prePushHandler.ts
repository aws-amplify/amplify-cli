import { $TSContext, stateManager } from '@aws-amplify/amplify-cli-core';
import { categoryName } from '../constants';
import {
  FunctionSecretsStateManager,
  getLocalFunctionSecretNames,
  storeSecretsPendingRemoval,
} from '../provider-utils/awscloudformation/secrets/functionSecretsStateManager';
import { ensureLambdaExecutionRoleOutputs } from '../provider-utils/awscloudformation/utils/ensure-lambda-arn-outputs';
import { ensureEnvironmentVariableValues } from '../provider-utils/awscloudformation/utils/environmentVariablesHelper';
/**
 * prePush Handler event for function category
 */
export const prePushHandler = async (context: $TSContext): Promise<void> => {
  await ensureEnvironmentVariableValues(context);
  await ensureFunctionSecrets(context);
  await ensureLambdaExecutionRoleOutputs();
};

const ensureFunctionSecrets = async (context: $TSContext): Promise<void> => {
  const backendConfig = stateManager.getBackendConfig();
  const functionNames = Object.keys(backendConfig?.[categoryName] || {});
  for (const funcName of functionNames) {
    if (getLocalFunctionSecretNames(funcName).length > 0) {
      const funcSecretsManager = await FunctionSecretsStateManager.getInstance(context);
      await funcSecretsManager.ensureNewLocalSecretsSyncedToCloud(funcName);
    }
  }
  await storeSecretsPendingRemoval(context, functionNames);
};
