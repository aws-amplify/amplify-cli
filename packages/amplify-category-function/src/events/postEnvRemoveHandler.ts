import { $TSContext } from 'amplify-cli-core';
import { FunctionSecretsStateManager } from '../provider-utils/awscloudformation/secrets/functionSecretsStateManager';

export const postEnvRemoveHandler = async (context: $TSContext, envName: string) => {
  await removeAllEnvSecrets(context, envName);
};

const removeAllEnvSecrets = async (context: $TSContext, envName: string) =>
  (await FunctionSecretsStateManager.getInstance(context)).deleteAllEnvironmentSecrets(envName);
