import { stateManager } from 'amplify-cli-core';
import * as path from 'path';
import { getAppId } from '../utils/get-app-id';

export const oAuthSecretsPathAmplifyAppIdKey = 'oAuthSecretsPathAmplifyAppId';
export const oauthObjSecretKey = 'hostedUIProviderCreds';

/**
  * Returns the full name of the SSM parameter for secretName in resourceName in envName.
  *
  * If envName is not specified, the current env is assumed
  */
export const getFullyQualifiedSecretName = (secretName: string, resourceName: string, envName?: string) => `${getOAuthSecretPrefix(resourceName, envName)}${secretName}`;

/**
  * Returns the SSM parameter name prefix for all secrets for the given function in the given env
  *
  * If envName is not specified, the current env is assumed
  */
export const getOAuthSecretPrefix = (resourceName: string, envName?: string) => path.posix.join(getEnvSecretPrefix(envName), `AMPLIFY_${resourceName}_`);

/**
  * Returns the SSM parameter name prefix for all secrets in the given env.
  *
  * If envName is not specified, the current env is assumed
  */
export const getEnvSecretPrefix = (envName: string = stateManager.getLocalEnvInfo()?.envName) => {
  if (!envName) {
    throw new Error('Could not determine the current Amplify environment name. Try running `amplify env checkout`.');
  }
  return path.posix.join('/amplify', getAppId(), envName);
};
