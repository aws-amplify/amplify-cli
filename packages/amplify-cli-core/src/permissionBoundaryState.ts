import { stateManager } from './state-manager';
import _ from 'lodash';

const teamProviderInfoObjectPath = (env?: string) => [
  env || (stateManager.getLocalEnvInfo().envName as string),
  'awscloudformation',
  'PermissionBoundaryPolicyArn',
];

export const getPermissionBoundaryArn: () => string | undefined = () => {
  try {
    const teamProviderInfo = stateManager.getTeamProviderInfo();
    return _.get(teamProviderInfo, teamProviderInfoObjectPath()) as string | undefined;
  } catch (err) {
    // uninitialized project
    return undefined;
  }
};

export const setPermissionBoundaryArn = (arn?: string, env?: string): void => {
  const teamProviderInfo = stateManager.getTeamProviderInfo();
  if (!arn) {
    _.unset(teamProviderInfo, teamProviderInfoObjectPath(env));
  } else {
    _.set(teamProviderInfo, teamProviderInfoObjectPath(env), arn);
  }
  stateManager.setTeamProviderInfo(undefined, teamProviderInfo);
};
