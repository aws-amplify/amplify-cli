import { stateManager } from 'amplify-cli-core';

export function getRootStackId(): string {
  const teamProviderInfo = stateManager.getTeamProviderInfo();
  const { envName } = stateManager.getLocalEnvInfo();
  const envTeamProviderInfo = teamProviderInfo[envName];
  if (envTeamProviderInfo && envTeamProviderInfo.awscloudformation) {
    const stackId = envTeamProviderInfo.awscloudformation.StackId;
    return stackId.split('/')[2];
  }
  throw new Error('Root stack Id not found');
}
