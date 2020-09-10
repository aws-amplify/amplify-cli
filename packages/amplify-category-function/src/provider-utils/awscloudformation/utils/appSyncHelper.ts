import { stateManager } from 'amplify-cli-core';

export function getAppSyncResourceName(): string {
  const amplifyMeta = stateManager.getCurrentMeta();
  return 'api' in amplifyMeta ? Object.keys(amplifyMeta.api).find(key => amplifyMeta.api[key].service === 'AppSync') : undefined;
}
