import { getEnvMeta } from '@aws-amplify/amplify-environment-parameters';

/**
 * Gets the root stack id
 */
export const getRootStackId = (): string => {
  const stackId = getEnvMeta().StackId;
  if (typeof stackId === 'string') {
    return stackId.split('/')[2];
  }
  throw new Error('Root stack Id not found');
};
