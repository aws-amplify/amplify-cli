import { printer } from '@aws-amplify/amplify-prompts';
import { $TSContext } from '@aws-amplify/amplify-cli-core';
import { FunctionSecretsStateManager } from '../provider-utils/awscloudformation/secrets/functionSecretsStateManager';

export const postEnvRemoveHandler = async (context: $TSContext, envName: string) => {
  try {
    await removeAllEnvSecrets(context, envName);
  } catch (err) {
    // catching this silently because that was the previous behavior
    // previously this error was caught by the platform event firing logic and silently ignored
    // now we are ignoring errors at the individual event handler
    printer.debug(`function category postEnvRemoveHandler failed to run.`);
    printer.debug(`You may need to manually clean up some function state.`);
    printer.debug(err);
  }
};

const removeAllEnvSecrets = async (context: $TSContext, envName: string) =>
  (await FunctionSecretsStateManager.getInstance(context)).deleteAllEnvironmentSecrets(envName);
