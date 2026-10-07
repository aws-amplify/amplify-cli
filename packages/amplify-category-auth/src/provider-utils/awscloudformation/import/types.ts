import { $TSAny, $TSContext, $TSObject } from '@aws-amplify/amplify-cli-core';
import {
  GetUserPoolMfaConfigResponse,
  IdentityProviderType,
  UserPoolClientType,
  UserPoolType,
} from '@aws-sdk/client-cognito-identity-provider';
import { CognitoIdentityProvider, IdentityPool } from '@aws-sdk/client-cognito-identity';
import { ICognitoUserPoolService, IIdentityPoolService } from '@aws-amplify/amplify-util-import';

export type AuthSelections = 'userPoolOnly' | 'identityPoolAndUserPool';

// parameters.json
export type ResourceParameters = {
  authSelections: AuthSelections;
  resourceName: string;
  serviceType: 'imported'; // string literal, not changing for import
  region: string;
};

// Persisted into amplify-meta
export type BackendConfiguration = {
  service: 'Cognito'; // string literal for this category
  serviceType: 'imported'; // string literal, not changing for import
  providerPlugin: string;
  dependsOn: $TSObject[];
  customAuth: boolean;
};

// Persisted into amplify-meta
export type MetaConfiguration = BackendConfiguration & {
  output: MetaOutput;
};

// Persisted into amplify-meta
export type MetaOutput = {
  UserPoolId?: string;
  UserPoolName?: string;
  IdentityPoolId?: string;
  IdentityPoolName?: string;
  AppClientID?: string;
  AppClientIDWeb?: string;
  AppClientSecret?: string;
  AmazonWebClient?: string;
  FacebookWebClient?: string;
  GoogleWebClient?: string;
  AppleWebClient?: string;
  HostedUIDomain?: string;
  HostedUICustomDomain?: string;
  OAuthMetadata?: string;
  CreatedSNSRole?: string;
};

export type AuthParameters = {
  dependsOn?: $TSAny[];
  triggers?: string;
  identityPoolName?: string;
  aliasAttributes?: string[];
  usernameAttributes?: string[];
  authProviders?: string[];
  authProvidersUserPool?: string[];
  requiredAttributes?: string[];
  passwordPolicyMinLength?: number;
  passwordPolicyCharacters?: string[];
  mfaConfiguration?: string;
  mfaTypes?: string[];
  autoVerifiedAttributes?: string[];
};

// Persisted into team-provider-info
export type EnvSpecificResourceParameters = {
  userPoolId: string;
  userPoolName: string;
  webClientId: string;
  nativeClientId: string;
  identityPoolId?: string;
  identityPoolName?: string;
  facebookAppId?: string;
  amazonAppId?: string;
  appleAppId?: string;
  googleIos?: string;
  googleAndroid?: string;
  googleClientId?: string;
  hostedUIProviderCreds?: string;
  allowUnauthenticatedIdentities?: boolean;
  authRoleArn?: string;
  authRoleName?: string;
  unauthRoleArn?: string;
  unauthRoleName?: string;
};

export type ImportAnswers = {
  authSelections?: AuthSelections;
  resourceName?: string;
  userPoolId?: string;
  userPool?: UserPoolType;
  appClientWebId?: string; // We need this member only to have a slot for this to fill by enquirer after answer, it is reset after appClientWeb is set
  appClientWeb?: UserPoolClientType;
  appClientNativeId?: string; // We need this member only to have a slot for this to fill by enquirer after answer, it is reset after appClientNative is set
  appClientNative?: UserPoolClientType;
  oauthProviders?: string[];
  oauthProperties?: OAuthProperties;
  mfaConfiguration?: GetUserPoolMfaConfigResponse;
  identityProviders?: IdentityProviderType[];
  identityPoolId?: string;
  identityPool?: IdentityPool;
  authRoleArn?: string;
  authRoleName?: string;
  unauthRoleArn?: string;
  unauthRoleName?: string;
};

export type UserPoolChoice = {
  message: string;
  value: string;
};

export type ImportParameters = {
  providerName: string;
  userPoolList: UserPoolChoice[];
  region?: string;
  webClients?: UserPoolClientType[];
  nativeClients?: UserPoolClientType[];
  validatedIdentityPools?: { identityPool: IdentityPool; providers: CognitoIdentityProvider[] }[];
  bothAppClientsWereAutoSelected?: boolean;
};

export type OAuthResult = {
  isValid: boolean;
  oauthProviders?: string[];
  oauthProperties?: OAuthProperties;
};

export type OAuthProperties = {
  callbackURLs?: string[];
  logoutURLs?: string[];
  allowedOAuthFlows?: string[];
  allowedOAuthScopes?: string[];
  allowedOAuthFlowsUserPoolClient?: boolean;
};

export type PartialOutput = {
  UserPoolId: string;
  UserPoolName: string;
  AppClientID: string;
  AppClientIDWeb: string;
};

export interface ProviderUtils {
  createCognitoUserPoolService(context: $TSContext): Promise<ICognitoUserPoolService>;
  createIdentityPoolService(context: $TSContext): Promise<IIdentityPoolService>;
  saveResourceParameters(
    context: $TSContext,
    category: string,
    resourceName: string,
    privateParams: $TSObject,
    envSpecificParams: string[],
  ): void;
  loadResourceParameters(context: $TSContext, category: string, resourceName: string): Record<string, $TSAny>;
}

export type ImportAuthHeadlessParameters = {
  userPoolId: string;
  webClientId: string;
  nativeClientId: string;
  identityPoolId?: string;
};
