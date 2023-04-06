import { stateManager } from '@aws-amplify/amplify-cli-core';

export function getAppSyncResourceName(): string {
  const amplifyMeta = stateManager.getMeta();
  const resource =
    'api' in amplifyMeta ? Object.keys(amplifyMeta.api).find((key) => amplifyMeta.api[key].service === 'AppSync') : undefined;
  return resource;
}
