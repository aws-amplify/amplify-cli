import { $TSContext, stateManager } from 'amplify-cli-core';
import {
  getFunctionSecretNames,
  tempStoreToBeRemovedFunctionsWithSecrets,
} from '../provider-utils/awscloudformation/secrets/functionParametersSecretsController';
import { FunctionSecretsStateManager } from '../provider-utils/awscloudformation/secrets/functionSecretsStateManager';
import { categoryName } from '../provider-utils/awscloudformation/utils/constants';

export const prePushHandler = async (context: $TSContext) => {
  await ensureFunctionSecrets(context);
};

const ensureFunctionSecrets = async (context: $TSContext) => {
  const amplifyMeta = stateManager.getMeta();
  const functionNames = Object.keys(amplifyMeta?.[categoryName]);

  for (const funcName of functionNames) {
    const secretNames = await getFunctionSecretNames(funcName);
    if (!secretNames.length) {
      continue;
    }
    const funcSecretsManager = await FunctionSecretsStateManager.getInstance(context);
    await funcSecretsManager.ensureNewLocalSecretsSyncedToCloud(funcName);
  }

  await tempStoreToBeRemovedFunctionsWithSecrets(context);
};
