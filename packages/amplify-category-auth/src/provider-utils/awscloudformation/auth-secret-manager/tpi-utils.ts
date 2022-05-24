import { getEnvParamManager } from '@aws-amplify/amplify-environment-parameters';
import { AmplifyCategories } from 'amplify-cli-core';
import { getAppId } from '../utils/get-app-id';
import { oAuthObjSecretKey, oAuthSecretsPathAmplifyAppIdKey } from './secret-name';
/**
 * sets app id in team provider info
 */
export const setAppIdForAuthInTeamProvider = (authResourceName: string): void => {
  getEnvParamManager()
    .getResourceParamManager(AmplifyCategories.AUTH, authResourceName)
    .setParam(oAuthSecretsPathAmplifyAppIdKey, getAppId());
};

/**
 * sets empty creds in team provider info for projects before ext migration
 */
export const setEmptyCredsForAuthInTeamProvider = (authResourceName: string): void => {
  getEnvParamManager()
    .getResourceParamManager(AmplifyCategories.AUTH, authResourceName)
    .setParam(oAuthObjSecretKey, '[]');
};

/**
 * remove app id in team provider info
 */
export const removeAppIdForAuthInTeamProvider = (authResourceName: string): void => {
  getEnvParamManager()
    .getResourceParamManager(AmplifyCategories.AUTH, authResourceName)
    .deleteParam(oAuthSecretsPathAmplifyAppIdKey);
};

/**
 * remove empty hostedUICreds in team provider info
 */
export const removeEmptyCredsForAuthInTeamProvider = (authResourceName: string): void => {
  getEnvParamManager()
    .getResourceParamManager(AmplifyCategories.AUTH, authResourceName)
    .deleteParam(oAuthObjSecretKey);
};
