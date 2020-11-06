import { stateManager } from 'amplify-cli-core';
import fetch from 'node-fetch';

export const originUrl = 'https://www.dracarys.app';

export const amplifyAdminUrl = (appId: string, envName: string) => `${originUrl}/admin/${appId}/${envName}/verify/`;

export function doAdminCredentialsExist(appId: string): boolean {
  return !!stateManager.getAmplifyAdminConfigEntry(appId);
}

export async function isAmplifyAdminApp(appId: string): Promise<boolean> {
  const url = `https://rh2kdo2x79.execute-api.us-east-1.amazonaws.com/gamma/AppState/?appId=${appId}`;
  const res = await fetch(`${url}`);
  const resJson = await res.json();
  return !!resJson.appId;
}
