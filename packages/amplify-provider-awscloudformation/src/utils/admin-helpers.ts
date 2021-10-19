import { stateManager, $TSContext } from 'amplify-cli-core';
import aws from 'aws-sdk';
import _ from 'lodash';
import fetch from 'node-fetch';
import { adminLoginFlow } from '../admin-login';
import { AdminAuthConfig, AwsSdkConfig, CognitoAccessToken, CognitoIdToken } from './auth-types';

export const adminVerifyUrl = (appId: string, envName: string, region: string): string => {
  const baseUrl = adminBackendMap[region].amplifyAdminUrl;
  return `${baseUrl}/admin/${appId}/${envName}/verify/`;
};

export function doAdminTokensExist(appId: string): boolean {
  if (!appId) {
    throw `Failed to check if admin credentials exist: appId is undefined`;
  }
  return !!stateManager.getAmplifyAdminConfigEntry(appId);
}

export async function isAmplifyAdminApp(appId: string): Promise<{ isAdminApp: boolean; region: string }> {
  if (!appId) {
    throw `Failed to check if Admin UI is enabled: appId is undefined`;
  }
  let appState = await getAdminAppState(appId, 'us-east-1');
  if (appState.appId && appState.region && appState.region !== 'us-east-1') {
    appState = await getAdminAppState(appId, appState.region);
  }
  return { isAdminApp: !!appState.appId, region: appState.region };
}

export async function getTempCredsWithAdminTokens(context: $TSContext, appId: string): Promise<AwsSdkConfig> {
  if (!doAdminTokensExist(appId)) {
    await adminLoginFlow(context, appId);
  }
  const authConfig = await getRefreshedTokens(context, appId);
  const { idToken, IdentityId, region } = authConfig;
  // use tokens to get creds and assign to config
  const awsConfig = await getAdminCognitoCredentials(idToken, IdentityId, region);
  aws.config.update(awsConfig);
  // need to use Cognito creds to get STS creds - otherwise
  // users will not be able to provision Cognito resources
  return await getAdminStsCredentials(idToken, region);
}

async function getAdminAppState(appId: string, region: string) {
  const res = await fetch(`${adminBackendMap[region].appStateUrl}/AppState/?appId=${appId}`);
  return res.json();
}

async function getAdminCognitoCredentials(idToken: CognitoIdToken, identityId: string, region: string): Promise<AwsSdkConfig> {
  const cognitoIdentity = new aws.CognitoIdentity({ region });
  const login = idToken.payload.iss.replace('https://', '');
  const { Credentials } = await cognitoIdentity
    .getCredentialsForIdentity({
      IdentityId: identityId,
      Logins: {
        [login]: idToken.jwtToken,
      },
    })
    .promise();

  return {
    accessKeyId: Credentials.AccessKeyId,
    expiration: Credentials.Expiration,
    region,
    secretAccessKey: Credentials.SecretKey,
    sessionToken: Credentials.SessionToken,
  };
}

async function getAdminStsCredentials(idToken: CognitoIdToken, region: string): Promise<AwsSdkConfig> {
  const sts = new aws.STS();
  const { Credentials } = await sts
    .assumeRole({
      RoleArn: idToken.payload['cognito:preferred_role'],
      RoleSessionName: 'amplifyadmin',
    })
    .promise();

  return {
    accessKeyId: Credentials.AccessKeyId,
    expiration: Credentials.Expiration,
    region,
    secretAccessKey: Credentials.SecretAccessKey,
    sessionToken: Credentials.SessionToken,
  };
}

async function getRefreshedTokens(context: $TSContext, appId: string) {
  // load token, check expiry, refresh if needed
  const authConfig: AdminAuthConfig = stateManager.getAmplifyAdminConfigEntry(appId);

  if (isJwtExpired(authConfig.idToken)) {
    let refreshedTokens: aws.CognitoIdentityServiceProvider.AuthenticationResultType;
    try {
      refreshedTokens = (await refreshJWTs(authConfig)).AuthenticationResult;
      // Refresh stored tokens
      authConfig.accessToken.jwtToken = refreshedTokens.AccessToken;
      authConfig.idToken.jwtToken = refreshedTokens.IdToken;
      stateManager.setAmplifyAdminConfigEntry(appId, authConfig);
    } catch {
      // Refresh failed, fall back to login
      await adminLoginFlow(context, appId, null, authConfig.region);
    }
  }
  return authConfig;
}

function isJwtExpired(token: CognitoAccessToken | CognitoIdToken) {
  const expiration = _.get(token, ['payload', 'exp'], 0);
  const secSinceEpoch = Math.round(new Date().getTime() / 1000);
  return secSinceEpoch >= expiration - 60;
}

async function refreshJWTs(authConfig: AdminAuthConfig) {
  const CognitoISP = new aws.CognitoIdentityServiceProvider({ region: authConfig.region });
  return await CognitoISP.initiateAuth({
    AuthFlow: 'REFRESH_TOKEN',
    AuthParameters: {
      REFRESH_TOKEN: authConfig.refreshToken.token,
    },
    ClientId: authConfig.accessToken.payload.client_id, // App client id from identityPool
  }).promise();
}

export const adminBackendMap: {
  [region: string]: {
    amplifyAdminUrl: string;
    appStateUrl: string;
  };
} = {
  'ap-northeast-1': {
    amplifyAdminUrl: 'https://ap-northeast-1.admin.amplifyapp.com',
    appStateUrl: 'https://prod.ap-northeast-1.appstate.amplifyapp.com/wave4Prod',
  },
  'ap-northeast-2': {
    amplifyAdminUrl: 'https://ap-northeast-2.admin.amplifyapp.com',
    appStateUrl: 'https://prod.ap-northeast-2.appstate.amplifyapp.com/wave4Prod',
  },
  'ap-south-1': {
    amplifyAdminUrl: 'https://ap-south-1.admin.amplifyapp.com',
    appStateUrl: 'https://prod.ap-south-1.appstate.amplifyapp.com/wave4Prod',
  },
  'ap-southeast-1': {
    amplifyAdminUrl: 'https://ap-southeast-1.admin.amplifyapp.com',
    appStateUrl: 'https://prod.ap-southeast-1.appstate.amplifyapp.com/wave3Prod',
  },
  'ap-southeast-2': {
    amplifyAdminUrl: 'https://ap-southeast-2.admin.amplifyapp.com',
    appStateUrl: 'https://prod.ap-southeast-2.appstate.amplifyapp.com/wave4Prod',
  },
  'ca-central-1': {
    amplifyAdminUrl: 'https://ca-central-1.admin.amplifyapp.com',
    appStateUrl: 'https://prod.ca-central-1.appstate.amplifyapp.com/wave5Prod',
  },
  'eu-central-1': {
    amplifyAdminUrl: 'https://eu-central-1.admin.amplifyapp.com',
    appStateUrl: 'https://prod.eu-central-1.appstate.amplifyapp.com/wave4Prod',
  },
  'eu-north-1': {
    amplifyAdminUrl: 'https://eu-north-1.admin.amplifyapp.com',
    appStateUrl: 'https://prod.eu-north-1.appstate.amplifyapp.com/wave5Prod',
  },
  'eu-west-1': {
    amplifyAdminUrl: 'https://eu-west-1.admin.amplifyapp.com',
    appStateUrl: 'https://prod.eu-west-1.appstate.amplifyapp.com/wave3Prod',
  },
  'eu-west-2': {
    amplifyAdminUrl: 'https://eu-west-2.admin.amplifyapp.com',
    appStateUrl: 'https://prod.eu-west-2.appstate.amplifyapp.com/wave1Prod',
  },
  'eu-west-3': {
    amplifyAdminUrl: 'https://eu-west-3.admin.amplifyapp.com',
    appStateUrl: 'https://prod.eu-west-3.appstate.amplifyapp.com/wave5Prod',
  },
  'me-south-1': {
    amplifyAdminUrl: 'https://me-south-1.admin.amplifyapp.com',
    appStateUrl: 'https://prod.me-south-1.appstate.amplifyapp.com/wave5Prod',
  },
  'sa-east-1': {
    amplifyAdminUrl: 'https://sa-east-1.admin.amplifyapp.com',
    appStateUrl: 'https://prod.sa-east-1.appstate.amplifyapp.com/wave5Prod',
  },
  'us-east-1': {
    amplifyAdminUrl: 'https://us-east-1.admin.amplifyapp.com',
    appStateUrl: 'https://prod.us-east-1.appstate.amplifyapp.com/wave3Prod',
  },
  'us-east-2': {
    amplifyAdminUrl: 'https://us-east-2.admin.amplifyapp.com',
    appStateUrl: 'https://prod.us-east-2.appstate.amplifyapp.com/wave2Prod',
  },
  'us-west-1': {
    amplifyAdminUrl: 'https://us-west-1.admin.amplifyapp.com',
    appStateUrl: 'https://prod.us-west-1.appstate.amplifyapp.com/wave5Prod',
  },
  'us-west-2': {
    amplifyAdminUrl: 'https://us-west-2.admin.amplifyapp.com',
    appStateUrl: 'https://prod.us-west-2.appstate.amplifyapp.com/wave4Prod',
  },
};
