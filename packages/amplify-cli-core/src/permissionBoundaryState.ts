import { stateManager } from './state-manager';
import _ from 'lodash';

const teamProviderInfoObjectPath = () => [stateManager.getLocalEnvInfo().envName, 'awscloudformation', 'PermissionBoundaryPolicyArn'];

export const getPermissionBoundaryArn: () => string | undefined = () => {
  try {
    const teamProviderInfo = stateManager.getTeamProviderInfo();
    return _.get(teamProviderInfo, teamProviderInfoObjectPath()) as string | undefined;
  } catch (err) {
    // uninitialized project
    return undefined;
  }
};

export const setPermissionBoundaryArn: (arn?: string) => void = arn => {
  const teamProviderInfo = stateManager.getTeamProviderInfo();
  if (!arn) {
    _.unset(teamProviderInfo, teamProviderInfoObjectPath());
  } else {
    _.set(teamProviderInfo, teamProviderInfoObjectPath(), arn);
  }
  stateManager.setTeamProviderInfo(undefined, teamProviderInfo);
};
