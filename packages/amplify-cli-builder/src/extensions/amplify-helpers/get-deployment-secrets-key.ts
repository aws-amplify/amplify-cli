import { stateManager } from 'amplify-cli-core';
import { v4 as uuid } from 'uuid';
import _ from 'lodash';

const prePushKeyName = 'prePushDeploymentSecretsKey';

export function getDeploymentSecretsKey(): string {
  const teamProviderInfo = stateManager.getTeamProviderInfo();
  const { envName } = stateManager.getLocalEnvInfo();
  const envTeamProviderInfo = teamProviderInfo[envName];

  const prePushKey = envTeamProviderInfo?.awscloudformation?.[prePushKeyName];
  if (prePushKey) {
    return prePushKey;
  }
  const stackId = envTeamProviderInfo?.awscloudformation?.StackId;
  if (typeof stackId === 'string') {
    return stackId.split('/')[2];
  }
  const newKey = uuid();
  _.set(teamProviderInfo, [envName, 'awscloudformation', prePushKeyName], newKey);
  stateManager.setTeamProviderInfo(undefined, teamProviderInfo);
  return newKey;
}
