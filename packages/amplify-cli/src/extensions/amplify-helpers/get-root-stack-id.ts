import { stateManager } from '@aws-amplify/amplify-cli-core';

/**
 * Gets the root stack id
 */
export const getRootStackId = (): string => {
  const amplifyMeta = stateManager.getMeta();
  const stackId = amplifyMeta?.providers?.awscloudformation?.StackId;
  if (typeof stackId === 'string') {
    return stackId.split('/')[2];
  }
  throw new Error('Root stack Id not found');
};
