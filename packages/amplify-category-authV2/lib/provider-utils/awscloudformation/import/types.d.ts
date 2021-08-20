import { $TSContext, $TSObject } from 'amplify-cli-core';
import {
  GetUserPoolMfaConfigResponse,
  IdentityProviderType,
  UserPoolClientType,
  UserPoolType,
} from 'aws-sdk/clients/cognitoidentityserviceprovider';
import { CognitoIdentityProvider, IdentityPool } from 'aws-sdk/clients/cognitoidentity';
import { ICognitoUserPoolService, IIdentityPoolService } from 'amplify-util-import';
export declare type AuthSelections = 'userPoolOnly' | 'identityPoolAndUserPool';
export declare type ResourceParameters = {
  authSelections: AuthSelections;
  resourceName: string;
  serviceType: 'imported';
  region: string;
};
export declare type BackendConfiguration = {
  service: 'Cognito';
  serviceType: 'imported';
  providerPlugin: string;
  dependsOn: $TSObject[];
  customAuth: boolean;
};
export declare type MetaConfiguration = BackendConfiguration & {
  output: MetaOutput;
};
export declare type MetaOutput = {
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
  OAuthMetadata?: string;
  CreatedSNSRole?: string;
};
export declare type EnvSpecificResourceParameters = {
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
export declare type ImportAnswers = {
  authSelections?: AuthSelections;
  resourceName?: string;
  userPoolId?: string;
  userPool?: UserPoolType;
  appClientWebId?: string;
  appClientWeb?: UserPoolClientType;
  appClientNativeId?: string;
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
export declare type UserPoolChoice = {
  message: string;
  value: string;
};
export declare type ImportParameters = {
  providerName: string;
  userPoolList: UserPoolChoice[];
  region?: string;
  webClients?: UserPoolClientType[];
  nativeClients?: UserPoolClientType[];
  validatedIdentityPools?: {
    identityPool: IdentityPool;
    providers: CognitoIdentityProvider[];
  }[];
  bothAppClientsWereAutoSelected?: boolean;
};
export declare type OAuthResult = {
  isValid: boolean;
  oauthProviders?: string[];
  oauthProperties?: OAuthProperties;
};
export declare type OAuthProperties = {
  callbackURLs?: string[];
  logoutURLs?: string[];
  allowedOAuthFlows?: string[];
  allowedOAuthScopes?: string[];
  allowedOAuthFlowsUserPoolClient?: boolean;
};
export declare type PartialOutput = {
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
  loadResourceParameters(context: $TSContext, category: string, resourceName: string): Record<string, any>;
}
export declare type ImportAuthHeadlessParameters = {
  userPoolId: string;
  webClientId: string;
  nativeClientId: string;
  identityPoolId?: string;
};
//# sourceMappingURL=types.d.ts.map
