import { stateManager, $TSContext } from 'amplify-cli-core';
import aws from 'aws-sdk';
import _ from 'lodash';
import fetch from 'node-fetch';
import { AuthConfig, CognitoAccessToken, CognitoIdToken } from './cognito-jwt-types';

export const adminVerifyUrl = (appId: string, envName: string, region: string): string => {
  const baseUrl = adminBackendMap[region].amplifyAdminUrl;
  return `${baseUrl}/admin/${appId}/${envName}/verify/`;
};

export function doAdminCredentialsExist(appId: string): boolean {
  if (!appId) {
    throw `Failed to check if admin credentials exist: appId is undefined`;
  }
  return !!stateManager.getAmplifyAdminConfigEntry(appId);
}

export async function isAmplifyAdminApp(appId: string): Promise<{ isAdminApp: boolean; region: string }> {
  if (!appId) {
    throw `Failed to check if Admin UI is enabled: appId is undefined`;
  }
  const res = await fetch(`${adminBackendMap['us-east-1'].appStateUrl}/AppState/?appId=${appId}`);
  const resJson = await res.json();
  return { isAdminApp: !!resJson.appId, region: resJson.region };
}

export async function getRefreshedTokens(appId: string, print: $TSContext['print']) {
  // load token, check expiry, refresh if needed
  const authConfig: AuthConfig = stateManager.getAmplifyAdminConfigEntry(appId);

  if (isJwtExpired(authConfig.idToken)) {
    const refreshedTokens = await refreshJWTs(authConfig, print);
    // Refresh stored tokens
    authConfig.idToken.jwtToken = refreshedTokens.IdToken;
    authConfig.accessToken.jwtToken = refreshedTokens.AccessToken;
    stateManager.setAmplifyAdminConfigEntry(appId, authConfig);
  }
  return authConfig;
}

function isJwtExpired(token: CognitoAccessToken | CognitoIdToken) {
  const expiration = _.get(token, ['payload', 'exp'], 0);
  const secSinceEpoch = Math.round(new Date().getTime() / 1000);
  return secSinceEpoch >= expiration - 60;
}

async function refreshJWTs(authConfig: AuthConfig, print: $TSContext['print']) {
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

export const adminBackendMap: {
  [region: string]: {
    amplifyAdminUrl: string;
    appStateUrl: string;
  };
} = {
  'ap-northeast-1': {
    amplifyAdminUrl: 'https://ap-northeast-1.admin.amplifyapp.com',
    appStateUrl: 'https://9ug6dmgf8k.execute-api.ap-northeast-1.amazonaws.com/wave4Prod',
  },
  'ap-northeast-2': {
    amplifyAdminUrl: 'https://ap-northeast-2.admin.amplifyapp.com',
    appStateUrl: 'https://ljnzstyu75.execute-api.ap-northeast-2.amazonaws.com/wave4Prod',
  },
  'ap-south-1': {
    amplifyAdminUrl: 'https://ap-south-1.admin.amplifyapp.com',
    appStateUrl: 'https://pnxd1wa44e.execute-api.ap-south-1.amazonaws.com/wave4Prod',
  },
  'ap-southeast-1': {
    amplifyAdminUrl: 'https://ap-southeast-1.admin.amplifyapp.com',
    appStateUrl: 'https://l5fi62t6yf.execute-api.ap-southeast-1.amazonaws.com/wave3Prod',
  },
  'ap-southeast-2': {
    amplifyAdminUrl: 'https://ap-southeast-2.admin.amplifyapp.com',
    appStateUrl: 'https://wv7blgges9.execute-api.ap-southeast-2.amazonaws.com/wave4Prod',
  },
  'ca-central-1': {
    amplifyAdminUrl: 'https://ca-central-1.admin.amplifyapp.com',
    appStateUrl: 'https://vnh7syjssb.execute-api.ca-central-1.amazonaws.com/wave5Prod',
  },
  'eu-central-1': {
    amplifyAdminUrl: 'https://eu-central-1.admin.amplifyapp.com',
    appStateUrl: 'https://atz311uyx5.execute-api.eu-central-1.amazonaws.com/wave4Prod',
  },
  'eu-west-1': {
    amplifyAdminUrl: 'https://eu-west-1.admin.amplifyapp.com',
    appStateUrl: 'https://8dbn4hxfme.execute-api.eu-west-1.amazonaws.com/wave3Prod',
  },
  'eu-west-2': {
    amplifyAdminUrl: 'https://eu-west-2.admin.amplifyapp.com',
    appStateUrl: 'https://apafhnmqme.execute-api.eu-west-2.amazonaws.com/wave1Prod',
  },
  'us-east-1': {
    amplifyAdminUrl: 'https://us-east-1.admin.amplifyapp.com',
    appStateUrl: 'https://e7auv6no3g.execute-api.us-east-1.amazonaws.com/wave3Prod',
  },
  'us-east-2': {
    amplifyAdminUrl: 'https://us-east-2.admin.amplifyapp.com',
    appStateUrl: 'https://x1wkkmql32.execute-api.us-east-2.amazonaws.com/wave2Prod',
  },
  'us-west-2': {
    amplifyAdminUrl: 'https://us-west-2.admin.amplifyapp.com',
    appStateUrl: 'https://3ne6skqg0g.execute-api.us-west-2.amazonaws.com/wave4Prod',
  },
};
