import { stateManager } from '@aws-amplify/amplify-cli-core';

export function getProjectConfig() {
  return stateManager.getProjectConfig();
}
