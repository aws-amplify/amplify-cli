import { $TSContext, stateManager } from 'amplify-cli-core';
import { removeSecret } from 'amplify-function-plugin-interface';
import { getLocalFunctionSecretNames } from '../provider-utils/awscloudformation/secrets/functionParametersSecretsController';
import { FunctionSecretsStateManager } from '../provider-utils/awscloudformation/secrets/functionSecretsStateManager';
import { secretNamesToSecretDeltas } from '../provider-utils/awscloudformation/secrets/secretDeltaUtilities';
import { categoryName } from '../provider-utils/awscloudformation/utils/constants';

export const postPushHandler = async (context: $TSContext) => {
  const amplifyMeta = stateManager.getMeta();
  const functionNames = Object.keys(amplifyMeta?.[categoryName]);

  for (const funcName of functionNames) {
    const secretNames = await getLocalFunctionSecretNames(funcName);
    if (!secretNames.length) {
      return;
    }
    const funcSecretsManager = await FunctionSecretsStateManager.getInstance(context);
    const removedSecretNames = await funcSecretsManager.computeLocallyRemovedSecrets(funcName);
    if (!removedSecretNames.length) {
      return;
    }
    await funcSecretsManager.syncSecretDeltas(secretNamesToSecretDeltas(removedSecretNames, removeSecret), funcName);
  }
};
