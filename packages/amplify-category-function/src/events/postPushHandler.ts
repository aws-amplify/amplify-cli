import { $TSContext, stateManager } from 'amplify-cli-core';
import { removeSecretCloud } from 'amplify-function-plugin-interface';
import _ from 'lodash';
import {
  getFunctionSecretNames,
  getRemovedFunctionsWithSecrets,
} from '../provider-utils/awscloudformation/secrets/functionParametersSecretsController';
import { FunctionSecretsStateManager } from '../provider-utils/awscloudformation/secrets/functionSecretsStateManager';
import { secretNamesToSecretDeltas } from '../provider-utils/awscloudformation/secrets/secretDeltaUtilities';
import { categoryName } from '../provider-utils/awscloudformation/utils/constants';

export const postPushHandler = async (context: $TSContext) => {
  await ensureSecretsCleanup(context);
};

const ensureSecretsCleanup = async (context: $TSContext) => {
  // ensure secrets removed locally are removed in the cloud
  const amplifyMeta = stateManager.getMeta();
  const functionNames = Object.keys(amplifyMeta?.[categoryName]);

  for (const funcName of functionNames) {
    const secretNames = await getFunctionSecretNames(funcName);
    if (!secretNames.length) {
      continue;
    }
    const funcSecretsManager = await FunctionSecretsStateManager.getInstance(context);
    await funcSecretsManager.ensureRemovedLocalSecretsSyncedToCloud(funcName);
  }

  // ensure secrets from removed functions are removed in the cloud
  const removedFunctionsWithSecretsMeta = getRemovedFunctionsWithSecrets();
  if (_.isEmpty(removedFunctionsWithSecretsMeta)) {
    return;
  }
  const funcSecretsManager = await FunctionSecretsStateManager.getInstance(context);
  await Promise.all(
    Object.entries(removedFunctionsWithSecretsMeta).map(([functionName, secretNames]) =>
      funcSecretsManager.syncSecretDeltas(secretNamesToSecretDeltas(secretNames, removeSecretCloud), functionName),
    ),
  );
};
