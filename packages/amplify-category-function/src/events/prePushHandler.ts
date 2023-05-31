import { printer } from '@aws-amplify/amplify-prompts';
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
  // if appId and envName can be resolved, proceed with checking env vars and secrets
  const envName = stateManager.getCurrentEnvName() || context?.exeInfo?.inputParams?.amplify?.envName;
  // get appId from amplify-meta or fallback to input params
  const appId: string | undefined =
    (stateManager.getMeta(undefined, { throwIfNotExist: false }) || {})?.providers?.awscloudformation?.AmplifyAppId ||
    context?.exeInfo?.inputParams?.amplify?.appId;

  // this handler is executed during `init --forcePush` which does an init, then a pull, then a push all in one
  // These parameters should always be present but it is possible they are not on init.
  // Hence this check will skip these checks if we can't resolve the prerequisite information
  if (envName && appId) {
    await ensureEnvironmentVariableValues(context, appId);
    await ensureFunctionSecrets(context);
  } else {
    printer.warn(
      'Could not resolve either appId, environment name or both. Skipping environment check for function secrets and environment variables',
    );
  }

  await ensureLambdaExecutionRoleOutputs();
};

const ensureFunctionSecrets = async (context: $TSContext): Promise<void> => {
  const backendConfig = stateManager.getBackendConfig(undefined, {
    throwIfNotExist: false,
  });
  const functionNames = Object.keys(backendConfig?.[categoryName] || {});
  for (const funcName of functionNames) {
    if (getLocalFunctionSecretNames(funcName).length > 0) {
      const funcSecretsManager = await FunctionSecretsStateManager.getInstance(context);
      await funcSecretsManager.ensureNewLocalSecretsSyncedToCloud(funcName);
    }
  }
  await storeSecretsPendingRemoval(context, functionNames);
};
