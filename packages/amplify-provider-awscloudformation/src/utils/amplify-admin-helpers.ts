import { stateManager } from 'amplify-cli-core';

export function doAdminCredentialsExist(appId: string): boolean {
  if (stateManager.getAmplifyAdminConfigEntry(appId)) {
    return true;
  }
  return false;
}
