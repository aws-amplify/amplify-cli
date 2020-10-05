import { AuthorizationConfig, AuthorizationMode, AuthorizationType } from '@aws-cdk/aws-appsync';
import { UserPool } from '@aws-cdk/aws-cognito';
import { Stack } from '@aws-cdk/core';
import { AppSyncAuthConfiguration, AppSyncAuthConfigurationEntry, AppSyncAuthMode } from '../transformation';

const authTypeMap: Record<AppSyncAuthMode, AuthorizationType> = {
  API_KEY: AuthorizationType.API_KEY,
  AMAZON_COGNITO_USER_POOLS: AuthorizationType.USER_POOL,
  AWS_IAM: AuthorizationType.IAM,
  OPENID_CONNECT: AuthorizationType.OIDC,
};
export function adoptAuthModes(stack: Stack, authConfig: AppSyncAuthConfiguration): AuthorizationConfig {
  return {
    defaultAuthorization: adoptAuthMode(stack, authConfig.defaultAuthentication),
    additionalAuthorizationModes: authConfig.additionalAuthenticationProviders?.map(entry => adoptAuthMode(stack, entry)),
  };
}

export function adoptAuthMode(stack: Stack, entry: AppSyncAuthConfigurationEntry): AuthorizationMode {
  const authType = authTypeMap[entry.authenticationType];
  switch (entry.authenticationType) {
    case AuthorizationType.API_KEY:
      return {
        authorizationType: authType,
        apiKeyConfig: entry.apiKeyConfig,
      };
    case AuthorizationType.USER_POOL:
      return {
        authorizationType: authType,
        userPoolConfig: {
          userPool: UserPool.fromUserPoolId(stack, 'transformer-user-pool', entry.userPoolConfig!.userPoolId),
        },
      };
    case AuthorizationType.IAM:
      return {
        authorizationType: authType,
      };
    case AuthorizationType.OIDC:
      return {
        authorizationType: authType,
        openIdConnectConfig: {
          oidcProvider: entry.openIDConnectConfig!.issuerUrl,
          clientId: entry.openIDConnectConfig!.clientId,
          tokenExpiryFromAuth: strToNumber(entry.openIDConnectConfig!.authTTL),
          tokenExpiryFromIssue: strToNumber(entry.openIDConnectConfig!.iatTTL),
        },
      };
    default:
      throw new Error('Invalid auth config');
  }
}

function strToNumber(input: string | number| undefined): number| undefined {
  if(typeof input === 'string') {
    return Number.parseInt(input, 10);
  }
  return input
}
