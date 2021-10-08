/**
 * This module contains methods for getting the full SSM parameter name of a secret from it's friendly name.
 * Also contains methods for getting a valid CFN object that will resolve to the SSM parameter name.
 *
 * WARNING: be extreemly careful changing anything about how secrets are named in SSM! (AKA you should probably never change this).
 * This format is sandardized with other Amplify Console SSM parameters and is expected by customer functions when fetching secrets at runtime
 */
import { stateManager } from 'amplify-cli-core';
import { Fn } from 'cloudform-types';
import * as path from 'path';

export const secretsPathAmplifyAppIdKey = 'secretsPathAmplifyAppId';

/**
 * Returns the full name of the SSM parameter for secretName in functionName in envName.
 *
 * If envName is not specified, the current env is assumed
 */
export const getFullyQualifiedSecretName = (secretName: string, functionName: string, envName?: string) =>
  `${getFunctionSecretPrefix(functionName, envName)}${secretName}`;

/**
 * Returns the SSM parameter name prefix for all secrets for the given function in the given env
 *
 * If envName is not specified, the current env is assumed
 */
export const getFunctionSecretPrefix = (functionName: string, envName?: string) =>
  path.posix.join(getEnvSecretPrefix(envName), `AMPLIFY_${functionName}_`);

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

// NOTE: Even though the following 2 functions are CFN specific, I'm putting them here to colocate all of the secret naming logic

/**
 * Retuns a CFN object that will resolve the the full name of the SSM parameter for secretName in functionName
 */
export const getFunctionSecretCfnName = (secretName: string, functionName: string) =>
  Fn.Join('', [getFunctionSecretCfnPrefix(functionName), secretName]);

/**
 * Returns a CFN object that will resolve to the SSM parameter name prefix for all secrets in a given function
 */
export const getFunctionSecretCfnPrefix = (functionName: string) =>
  Fn.Sub(path.posix.join('/amplify', '${appId}', '${env}', 'AMPLIFY_${functionName}_'), {
    appId: Fn.Ref(secretsPathAmplifyAppIdKey),
    env: Fn.Ref('env'), // this is dependent on the Amplify env name being a parameter to the CFN template which should always be the case
    functionName,
  });

export const getAppId = () => {
  const meta = stateManager.getMeta(undefined, { throwIfNotExist: false });
  const appId = meta?.providers?.awscloudformation?.AmplifyAppId;
  if (!appId) {
    throw new Error('Could not find an Amplify AppId in the amplfiy-meta.json file. Make sure your project is initialized in the cloud.');
  }
  return appId;
};
