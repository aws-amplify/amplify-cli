import { stateManager } from '@aws-amplify/amplify-cli-core';

export const getUserPoolIdFromMeta = (resourceName: string): string | undefined => {
  const amplifyMeta = stateManager.getMeta();
  const resource = (amplifyMeta?.auth || {})[resourceName];

  return resource?.output?.UserPoolId;
};
