import { stateManager } from './state-manager';
import _ from 'lodash';
import { $TSObject } from '.';

let preInitTeamProviderInfo: any;

export const getPermissionsBoundaryArn = (env?: string): string | undefined => {
  try {
    const tpi = preInitTeamProviderInfo ?? stateManager.getTeamProviderInfo();
    // if the pre init team-provider-info only has one env (which should always be the case), default to that one
    if (preInitTeamProviderInfo && Object.keys(preInitTeamProviderInfo).length === 1 && !env) {
      env = Object.keys(preInitTeamProviderInfo)[0];
    }
    return _.get(tpi, teamProviderInfoObjectPath(env)) as string | undefined;
  } catch {
    // uninitialized project
    return undefined;
  }
};

/**
 * Stores the permissions boundary ARN in team-provider-info
 * If teamProviderInfo is not specified, the file is read, updated and written back to disk
 * If teamProviderInfo is specified, then this function assumes that the env is not initialized
 *    In this case, the teamProviderInfo object is updated but not written to disk. Instead "preInitTeamProviderInfo" is set
 *    so that subsequent calls to getPermissionsBoundaryArn will return the permissions boundary arn of the pre-initialized env
 * @param arn The permissions boundary arn. If undefined or empty, the permissions boundary is removed
 * @param env The Amplify env to update. If not specified, defaults to the current checked out environment
 * @param teamProviderInfo The team-provider-info object to update
 */
export const setPermissionsBoundaryArn = (arn?: string, env?: string, teamProviderInfo?: $TSObject): void => {
  let tpiGetter = () => stateManager.getTeamProviderInfo();
  let tpiSetter = (tpi: $TSObject) => {
    stateManager.setTeamProviderInfo(undefined, tpi);
    preInitTeamProviderInfo = undefined;
  };
  if (teamProviderInfo) {
    tpiGetter = () => teamProviderInfo;
    tpiSetter = (tpi: $TSObject) => {
      preInitTeamProviderInfo = tpi;
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
  'PermissionsBoundaryPolicyArn',
];
