import { stateManager } from 'amplify-cli-core';

export function getProjectConfig() {
  return stateManager.getProjectConfig();
}
