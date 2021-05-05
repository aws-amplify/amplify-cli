import { stateManager } from './state-manager';
import _ from 'lodash';
import { $TSObject } from '.';

export const getPermissionBoundaryArn = (env?: string): string | undefined => {
  try {
    const preInitTpi = (global as any).preInitTeamProviderInfo;
    const teamProviderInfo = preInitTpi ?? stateManager.getTeamProviderInfo();
    // if the pre init team-provider-info only has one env (which should always be the case), default to that one
    if (preInitTpi && Object.keys(preInitTpi).length === 1 && !env) {
      env = Object.keys(preInitTpi)[0];
    }
    return _.get(teamProviderInfo, teamProviderInfoObjectPath(env)) as string | undefined;
  } catch (err) {
    // uninitialized project
    return undefined;
  }
};

/**
 * Stores the permission boundary ARN in team-provider-info
 * If teamProviderInfo is not specified, the file is read, updated and written back to disk
 * If teamProviderInfo is specified, then this function assumes that the env is not initialized
 *    In this case, the teamProviderInfo object is updated but not written to disk. Instead "preInitTeamProviderInfo" is set
 *    so that subsequent calls to getPermissionBoundaryArn will return the permission boundary arn of the pre-initialized env
 * @param arn The permission boundary arn. If undefined or empty, the permission boundary is removed
 * @param env The Amplify env to update. If not specified, defaults to the current checked out environment
 * @param teamProviderInfo The team-provider-info object to update
 */
export const setPermissionBoundaryArn = (arn?: string, env?: string, teamProviderInfo?: $TSObject): void => {
  let tpiGetter = () => stateManager.getTeamProviderInfo();
  let tpiSetter = (tpi: $TSObject) => {
    stateManager.setTeamProviderInfo(undefined, tpi);
    delete (global as any).preInitTeamProviderInfo; // avoids a potential edge case where set permissions is called again w/o tpi
  };
  if (teamProviderInfo) {
    tpiGetter = () => teamProviderInfo;
    tpiSetter = (tpi: $TSObject) => {
      (global as any).preInitTeamProviderInfo = tpi;
    };
  }
  const tpi = tpiGetter();
  if (!arn) {
    _.unset(tpi, teamProviderInfoObjectPath(env));
  } else {
    _.set(tpi, teamProviderInfoObjectPath(env), arn);
  }
  tpiSetter(tpi);
};

const teamProviderInfoObjectPath = (env?: string) => [
  env || (stateManager.getLocalEnvInfo().envName as string),
  'awscloudformation',
  'PermissionBoundaryPolicyArn',
];
