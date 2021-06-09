import { $TSContext, stateManager } from 'amplify-cli-core';
import { getLocalFunctionSecretNames } from '../provider-utils/awscloudformation/secrets/functionParametersSecretsController';
import { FunctionSecretsStateManager } from '../provider-utils/awscloudformation/secrets/functionSecretsStateManager';
import { prePushMissingSecretsWalkthrough } from '../provider-utils/awscloudformation/service-walkthroughs/secretValuesWalkthrough';
import { categoryName } from '../provider-utils/awscloudformation/utils/constants';

export const prePushHandler = async (context: $TSContext) => {
  const amplifyMeta = stateManager.getMeta();
  const functionNames = Object.keys(amplifyMeta?.[categoryName]);

  for (const funcName of functionNames) {
    const secretNames = await getLocalFunctionSecretNames(funcName);
    if (!secretNames.length) {
      return;
    }
    const funcSecretsManager = await FunctionSecretsStateManager.getInstance(context);
    const addedSecrets = await funcSecretsManager.computeLocallyAddedSecrets(funcName);
    if (!addedSecrets.length) {
      return;
    }
    const delta = await prePushMissingSecretsWalkthrough(funcName, addedSecrets);
    await funcSecretsManager.syncSecretDeltas(delta, funcName);
  }
};
