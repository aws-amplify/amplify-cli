import { AuthorizationConfig, AuthorizationMode, AuthorizationType } from '@aws-cdk/aws-appsync';
import { UserPool } from '@aws-cdk/aws-cognito';
import { Duration, Expiration } from '@aws-cdk/core';
import { StackManager } from '../transformer-context/stack-manager';
import { AppSyncAuthConfiguration, AppSyncAuthConfigurationEntry, AppSyncAuthMode } from '@aws-amplify/graphql-transformer-interfaces';

const authTypeMap: Record<AppSyncAuthMode, AuthorizationType> = {
  API_KEY: AuthorizationType.API_KEY,
  AMAZON_COGNITO_USER_POOLS: AuthorizationType.USER_POOL,
  AWS_IAM: AuthorizationType.IAM,
  OPENID_CONNECT: AuthorizationType.OIDC,
};

export const IAM_AUTH_ROLE_PARAMETER = 'authRoleName';
export const IAM_UNAUTH_ROLE_PARAMETER = 'unauthRoleName';

export function adoptAuthModes(stack: StackManager, authConfig: AppSyncAuthConfiguration): AuthorizationConfig {
  return {
    defaultAuthorization: adoptAuthMode(stack, authConfig.defaultAuthentication),
    additionalAuthorizationModes: authConfig.additionalAuthenticationProviders?.map(entry => adoptAuthMode(stack, entry)),
  };
}

export function adoptAuthMode(stackManager: StackManager, entry: AppSyncAuthConfigurationEntry): AuthorizationMode {
  const authType = authTypeMap[entry.authenticationType];
  switch (entry.authenticationType) {
    case AuthorizationType.API_KEY:
      return {
        authorizationType: authType,
        apiKeyConfig: {
          description: entry.apiKeyConfig?.description,
          expires: entry.apiKeyConfig?.apiKeyExpirationDays
            ? Expiration.after(Duration.days(entry.apiKeyConfig.apiKeyExpirationDays))
            : undefined,
        },
      };
    case AuthorizationType.USER_POOL:
      const userPoolId = stackManager.addParameter('AuthCognitoUserPoolId', {
        type: 'String',
      }).valueAsString;
      const rootStack = stackManager.rootStack;
      return {
        authorizationType: authType,
        userPoolConfig: {
          userPool: UserPool.fromUserPoolId(rootStack, 'transformer-user-pool', userPoolId),
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

function strToNumber(input: string | number | undefined): number | undefined {
  if (typeof input === 'string') {
    return Number.parseInt(input, 10);
  }
  return input;
}
