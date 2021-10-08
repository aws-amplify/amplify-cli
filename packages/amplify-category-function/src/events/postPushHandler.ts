import { $TSContext } from 'amplify-cli-core';
import { FunctionSecretsStateManager } from '../provider-utils/awscloudformation/secrets/functionSecretsStateManager';

export const postPushHandler = async (context: $TSContext) => {
  await ensureSecretsCleanup(context);
};

const ensureSecretsCleanup = async (context: $TSContext) => {
  const funcSecretsManager = await FunctionSecretsStateManager.getInstance(context);
  await funcSecretsManager.syncSecretsPendingRemoval();
};
