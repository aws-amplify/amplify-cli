import {
  AppSyncAuthType,
  AppSyncAPIKeyAuthType,
  AppSyncCognitoUserPoolsAuthType,
  AppSyncOpenIDConnectAuthType,
} from 'amplify-headless-interface';
import _ from 'lodash';

/**
 * Converts the authConfig object that is returned by the AppSync walkthrough into the AppSyncAuthType defined by the AddApiRequest
 *
 * Used when transforming the walkthrough result into an AddApiRequest
 */
export const authConfigToAppSyncAuthType = (authConfig: any = {}): AppSyncAuthType => {
  return _.get(authConfigToAppSyncAuthTypeMap, authConfig.authenticationType, () => undefined)(authConfig);
};

/**
 * Converts an AppSyncAuthType object into the authConfig object that gets written to amplify-meta
 *
 * This conversion is necessary to ensure we are storing the authConfig in the same way as older projects
 * @param authType
 */
export const appSyncAuthTypeToAuthConfig = (authType?: AppSyncAuthType) => {
  if (!authType) return undefined;
  return _.get(appSyncAuthTypeToAuthConfigMap, authType.mode, () => undefined)(authType);
};

const authConfigToAppSyncAuthTypeMap: Record<string, (authConfig: any) => AppSyncAuthType> = {
  API_KEY: authConfig => ({
    mode: 'API_KEY',
    expirationTime: authConfig.apiKeyConfig.apiKeyExpirationDays,
    apiKeyExpirationDate: authConfig.apiKeyConfig?.apiKeyExpirationDate,
    keyDescription: authConfig.apiKeyConfig.description,
  }),
  AWS_IAM: () => ({
    mode: 'AWS_IAM',
  }),
  AMAZON_COGNITO_USER_POOLS: authConfig => ({
    mode: 'AMAZON_COGNITO_USER_POOLS',
    cognitoUserPoolId: authConfig.userPoolConfig.userPoolId,
  }),
  OPENID_CONNECT: authConfig => ({
    mode: 'OPENID_CONNECT',
    openIDProviderName: authConfig.openIDConnectConfig.name,
    openIDIssuerURL: authConfig.openIDConnectConfig.issuerUrl,
    openIDClientID: authConfig.openIDConnectConfig.clientId,
    openIDAuthTTL: authConfig.openIDConnectConfig.authTTL,
    openIDIatTTL: authConfig.openIDConnectConfig.iatTTL,
  }),
};

const appSyncAuthTypeToAuthConfigMap: Record<string, (authType: AppSyncAuthType) => any> = {
  API_KEY: (authType: AppSyncAPIKeyAuthType) => ({
    authenticationType: 'API_KEY',
    apiKeyConfig: {
      apiKeyExpirationDays: authType.expirationTime,
      apiKeyExpirationDate: authType?.apiKeyExpirationDate,
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
