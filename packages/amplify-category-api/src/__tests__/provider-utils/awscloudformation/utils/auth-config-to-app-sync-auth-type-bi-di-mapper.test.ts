import {
  authConfigToAppSyncAuthType,
  appSyncAuthTypeToAuthConfig,
} from '../../../../provider-utils/awscloudformation/utils/auth-config-to-app-sync-auth-type-bi-di-mapper';
import {
  AppSyncAPIKeyAuthType,
  AppSyncAWSIAMAuthType,
  AppSyncCognitoUserPoolsAuthType,
  AppSyncOpenIDConnectAuthType,
} from 'amplify-headless-interface';

describe('authConfig to AppSyncAuthType', () => {
  it('maps API_KEY auth correctly', () => {
    const authConfig = {
      authenticationType: 'API_KEY',
      apiKeyConfig: {
        apiKeyExpirationDays: 120,
        description: 'api key description',
      },
    };

    expect(authConfigToAppSyncAuthType(authConfig)).toMatchSnapshot();
  });

  it('maps AWS_IAM auth correctly', () => {
    const authConfig = {
      authenticationType: 'AWS_IAM',
    };

    expect(authConfigToAppSyncAuthType(authConfig)).toMatchSnapshot();
  });

  it('maps AMAZON_COGNITO_USER_POOLS auth correctly', () => {
    const authConfig = {
      authenticationType: 'AMAZON_COGNITO_USER_POOLS',
      userPoolConfig: {
        userPoolId: 'userPoolId',
      },
    };

    expect(authConfigToAppSyncAuthType(authConfig)).toMatchSnapshot();
  });

  it('maps OPENID_CONNECT auth correclty', () => {
    const authConfig = {
      authenticationType: 'OPENID_CONNECT',
      openIDConnectConfig: {
        name: 'openid name',
        issuerUrl: 'issuer url',
        clientId: 'client id',
        authTTL: 'auth TTL',
        iatTTL: 'iat TTL',
      },
    };

    expect(authConfigToAppSyncAuthType(authConfig)).toMatchSnapshot();
  });

  it('returns undefined on undefined input', () => {
    expect(authConfigToAppSyncAuthType(undefined)).toBeUndefined();
  });
});

describe('AppSyncAuthType to authConfig', () => {
  it('maps API_KEY correctly', () => {
    const authType: AppSyncAPIKeyAuthType = {
      mode: 'API_KEY',
      expirationTime: 120,
    };
    expect(appSyncAuthTypeToAuthConfig(authType)).toMatchSnapshot();
  });

  it('maps AWS_IAM correctly', () => {
    const authType: AppSyncAWSIAMAuthType = {
      mode: 'AWS_IAM',
    };
    expect(appSyncAuthTypeToAuthConfig(authType)).toMatchSnapshot();
  });

  it('maps AMAZON_COGNITO_USER_POOLS correctly', () => {
    const authType: AppSyncCognitoUserPoolsAuthType = {
      mode: 'AMAZON_COGNITO_USER_POOLS',
      cognitoUserPoolId: 'someID',
    };
    expect(appSyncAuthTypeToAuthConfig(authType)).toMatchSnapshot();
  });

  it('maps OPENID_CONNECT correctly', () => {
    const authType: AppSyncOpenIDConnectAuthType = {
      mode: 'OPENID_CONNECT',
      openIDProviderName: 'providerName',
      openIDClientID: 'client id',
      openIDIssuerURL: 'issuer url',
    };

    expect(appSyncAuthTypeToAuthConfig(authType)).toMatchSnapshot();
  });

  it('returns undefined on undefined input', () => {
    expect(appSyncAuthTypeToAuthConfig(undefined)).toBeUndefined();
  });
});
