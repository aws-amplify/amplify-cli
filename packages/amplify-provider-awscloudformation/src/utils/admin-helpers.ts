import { stateManager, $TSContext } from 'amplify-cli-core';
import aws from 'aws-sdk';
import _ from 'lodash';
import fetch from 'node-fetch';

export const originUrl = 'https://www.dracarys.app';

export const amplifyAdminUrl = (appId: string, envName: string) => `${originUrl}/admin/${appId}/${envName}/verify/`;

export function doAdminCredentialsExist(appId: string): boolean {
  return !!stateManager.getAmplifyAdminConfigEntry(appId);
}

export async function isAmplifyAdminApp(appId: string): Promise<boolean> {
  if (doAdminCredentialsExist(appId)) {
    return true;
  }
  const url = `https://rh2kdo2x79.execute-api.us-east-1.amazonaws.com/gamma/AppState/?appId=${appId}`;
  const res = await fetch(`${url}`);
  const resJson = await res.json();
  return !!resJson.appId;
}

export async function getRefreshedTokens(appId: string, print: $TSContext['print']) {
  // load token, check expiry, refresh if needed
  const authConfig = stateManager.getAmplifyAdminConfigEntry(appId);

  if (isJwtExpired(authConfig.idToken)) {
    const refreshedTokens = await refreshJWTs(authConfig, print);
    // Refresh stored tokens
    authConfig.idToken.jwtToken = refreshedTokens.IdToken;
    authConfig.accessToken.jwtToken = refreshedTokens.AccessToken;
    stateManager.setAmplifyAdminConfigEntry(appId, authConfig);
  }
  return authConfig;
}

function isJwtExpired(token) {
  const expiration = _.get(token, ['payload', 'exp'], 0);
  const secSinceEpoch = Math.round(new Date().getTime() / 1000);
  return secSinceEpoch >= expiration - 60;
}

async function refreshJWTs(authConfig, print) {
  const CognitoISP = new aws.CognitoIdentityServiceProvider({ region: authConfig.region });
  try {
    const result = await CognitoISP.initiateAuth({
      AuthFlow: 'REFRESH_TOKEN',
      AuthParameters: {
        REFRESH_TOKEN: authConfig.refreshToken.token,
      },
      ClientId: authConfig.accessToken.payload.client_id, // App client id from identityPool
    }).promise();
    return result.AuthenticationResult;
  } catch (e) {
    print.error('Failed to refresh tokens.');
    throw e;
  }
}
