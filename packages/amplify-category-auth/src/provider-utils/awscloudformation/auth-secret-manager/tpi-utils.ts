import { AmplifyCategories, stateManager } from 'amplify-cli-core';
import _ from 'lodash';
import { getAppId } from '../utils/get-app-id';
import { oAuthSecretsPathAmplifyAppIdKey } from './secret-name';
/**
 * sets app id in team provider info
 */
export const setAppIdForFunctionInTeamProvider = (authResourceName: string): void => {
  const tpi = stateManager.getTeamProviderInfo(undefined, { throwIfNotExist: false, default: {} });
  const env = stateManager.getLocalEnvInfo()?.envName as string;
  let funcTpi = tpi?.[env]?.categories?.[AmplifyCategories.AUTH]?.[authResourceName];
  if (!funcTpi) {
    _.set(tpi, [env, 'categories', AmplifyCategories.AUTH, authResourceName], {});
    funcTpi = tpi[env].categories[AmplifyCategories.AUTH][authResourceName];
  }
  _.assign(funcTpi, { [oAuthSecretsPathAmplifyAppIdKey]: getAppId() });
  stateManager.setTeamProviderInfo(undefined, tpi);
};

/**
 * remove app id in tea provider info
 */
export const removeAppIdForFunctionInTeamProvider = (authResourceName: string): void => {
  const tpi = stateManager.getTeamProviderInfo(undefined, { throwIfNotExist: false, default: {} });
  const env = stateManager.getLocalEnvInfo()?.envName as string;
  _.unset(tpi, [env, 'categories', AmplifyCategories.AUTH, authResourceName, oAuthSecretsPathAmplifyAppIdKey]);
  stateManager.setTeamProviderInfo(undefined, tpi);
};
