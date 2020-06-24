import {
  AppSyncAuthType,
  AppSyncAPIKeyAuthType,
  AppSyncCognitoUserPoolsAuthType,
  AppSyncOpenIDConnectAuthType,
} from 'amplify-headless-interface';
import _ from 'lodash';

export const authConfigToAppSyncAuthType = (authConfig: any = {}): AppSyncAuthType => {
  return _.get(authConfigToAppSyncAuthTypeMap, authConfig.authenticationType, () => undefined)(authConfig);
};

export const appSyncAuthTypeToAuthConfig = (authType?: AppSyncAuthType) => {
  if (!authType) return undefined;
  return _.get(appSyncAuthTypeToAuthConfigMap, authType.mode, () => undefined)(authType);
};

const authConfigToAppSyncAuthTypeMap: Record<string, (oldAuthObj: any) => AppSyncAuthType> = {
  API_KEY: oldAuthObj => ({
    mode: 'API_KEY',
    expirationTime: oldAuthObj.apiKeyConfig.apiKeyExpirationDays,
    keyDescription: oldAuthObj.apiKeyConfig.description,
  }),
  AWS_IAM: () => ({
    mode: 'AWS_IAM',
  }),
  AMAZON_COGNITO_USER_POOLS: oldAuthObj => ({
    mode: 'AMAZON_COGNITO_USER_POOLS',
    cognitoUserPoolId: oldAuthObj.userPoolConfig.userPoolId,
  }),
  OPENID_CONNECT: oldAuthObj => ({
    mode: 'OPENID_CONNECT',
    openIDProviderName: oldAuthObj.openIDConnectConfig.name,
    openIDIssuerURL: oldAuthObj.openIDConnectConfig.issuerUrl,
    openIDClientID: oldAuthObj.openIDConnectConfig.clientId,
    openIDAuthTTL: oldAuthObj.openIDConnectConfig.authTTL,
    openIDIatTTL: oldAuthObj.openIDConnectConfig.iatTTL,
  }),
};

const appSyncAuthTypeToAuthConfigMap: Record<string, (authType: AppSyncAuthType) => any> = {
  API_KEY: (authType: AppSyncAPIKeyAuthType) => ({
    authenticationType: 'API_KEY',
    apiKeyConfig: {
      apiKeyExpirationDays: authType.expirationTime,
      description: authType.keyDescription,
    },
  }),
  AWS_IAM: () => ({
    authenticationType: 'AWS_IAM',
  }),
  AMAZON_COGNITO_USER_POOLS: (authType: AppSyncCognitoUserPoolsAuthType) => ({
    authenticationType: 'AMAZON_COGNITO_USER_POOLS',
    userPoolConfig: {
      userPoolId: authType.cognitoUserPoolId,
    },
  }),
  OPENID_CONNECT: (authType: AppSyncOpenIDConnectAuthType) => ({
    authenticationType: 'OPENID_CONNECT',
    openIDConnectConfig: {
      name: authType.openIDProviderName,
      issuerUrl: authType.openIDIssuerURL,
      clientId: authType.openIDClientID,
      authTTL: authType.openIDAuthTTL,
      iatTTL: authType.openIDIatTTL,
    },
  }),
};
