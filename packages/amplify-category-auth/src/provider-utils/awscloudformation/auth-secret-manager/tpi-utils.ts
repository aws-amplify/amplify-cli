import { AmplifyCategories, stateManager } from 'amplify-cli-core';
import _ from 'lodash';
import { getAppId } from '../utils/get-app-id';
import { oAuthObjSecretKey, oAuthSecretsPathAmplifyAppIdKey } from './secret-name';
/**
 * sets app id in team provider info
 */
export const setAppIdForAuthInTeamProvider = (authResourceName: string): void => {
  const tpi = stateManager.getTeamProviderInfo(undefined, { throwIfNotExist: false, default: {} });
  const env = stateManager.getLocalEnvInfo()?.envName as string;
  let authResourceTpi = tpi?.[env]?.categories?.[AmplifyCategories.AUTH]?.[authResourceName];
  if (!authResourceTpi) {
    _.set(tpi, [env, 'categories', AmplifyCategories.AUTH, authResourceName], {});
    authResourceTpi = tpi[env].categories[AmplifyCategories.AUTH][authResourceName];
  }
  _.assign(authResourceTpi, { [oAuthSecretsPathAmplifyAppIdKey]: getAppId() });
  stateManager.setTeamProviderInfo(undefined, tpi);
};

/**
 * sets empty creds in team provider info for projects before ext migration
 */
export const setEmptyCredsForAuthInTeamProvider = (authResourceName: string): void => {
  const tpi = stateManager.getTeamProviderInfo(undefined, { throwIfNotExist: false, default: {} });
  const env = stateManager.getLocalEnvInfo()?.envName as string;
  let authResourceTpi = tpi?.[env]?.categories?.[AmplifyCategories.AUTH]?.[authResourceName];
  if (!authResourceTpi) {
    _.set(tpi, [env, 'categories', AmplifyCategories.AUTH, authResourceName], {});
    authResourceTpi = tpi[env].categories[AmplifyCategories.AUTH][authResourceName];
  }
  _.assign(authResourceTpi, { [oAuthObjSecretKey]: '[]' });
  stateManager.setTeamProviderInfo(undefined, tpi);
};

/**
 * remove app id in team provider info
 */
export const removeAppIdForAuthInTeamProvider = (authResourceName: string): void => {
  const tpi = stateManager.getTeamProviderInfo(undefined, { throwIfNotExist: false, default: {} });
  const env = stateManager.getLocalEnvInfo()?.envName as string;
  _.unset(tpi, [env, 'categories', AmplifyCategories.AUTH, authResourceName, oAuthSecretsPathAmplifyAppIdKey]);
  stateManager.setTeamProviderInfo(undefined, tpi);
};
