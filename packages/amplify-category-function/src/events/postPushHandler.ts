import { $TSContext } from 'amplify-cli-core';
import _ from 'lodash';
import {
  areRemovedSecretsPending,
  FunctionSecretsStateManager,
} from '../provider-utils/awscloudformation/secrets/functionSecretsStateManager';

export const postPushHandler = async (context: $TSContext) => {
  await ensureSecretsCleanup(context);
};

const ensureSecretsCleanup = async (context: $TSContext) => {
  if (areRemovedSecretsPending()) {
    const funcSecretsManager = await FunctionSecretsStateManager.getInstance(context);
    await funcSecretsManager.syncSecretsPendingRemoval();
  }
};
