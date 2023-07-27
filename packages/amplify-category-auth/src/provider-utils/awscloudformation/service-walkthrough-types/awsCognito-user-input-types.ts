import { $TSAny } from '@aws-amplify/amplify-cli-core';

export interface CognitoCLIInputs {
  version?: string;
  cognitoConfig: CognitoConfiguration;
}

export type CognitoConfiguration = ServiceQuestionsBaseResult &
  OAuthResult &
  SocialProviderResult &
  IdentityPoolResult &
  PasswordPolicyResult &
  PasswordRecoveryResult &
  MfaResult &
  AdminQueriesResult &
  Triggers;

export interface ServiceQuestionsBaseResult {
  serviceName: 'Cognito';
  resourceName: string;
  useDefault: 'default' | 'defaultSocial' | 'manual';
  updateFlow?: 'default' | 'defaultSocial' | 'manual' | 'callbacks' | 'providers' | 'updateUserPoolGroups' | 'updateAdminQueries';
  requiredAttributes?: string[];
  authSelections: 'userPoolOnly' | 'identityPoolAndUserPool' | 'identityPoolOnly';
  userPoolName?: string;
  usernameAttributes?: UsernameAttributes[];
  aliasAttributes?: AliasAttributes[];
  userPoolGroups?: boolean;
  userPoolGroupList?: string[];
  userpoolClientRefreshTokenValidity?: string | number;
  userpoolClientReadAttributes?: string[];
  userpoolClientWriteAttributes?: string[];
  userpoolClientSetAttributes?: boolean;
  usernameCaseSensitive?: boolean;
  verificationBucketName?: string;
  resourceNameTruncated?: string;
  sharedId?: string;
  userpoolClientGenerateSecret?: boolean;
  userpoolClientLambdaRole?: string;
  useEnabledMfas?: boolean;
}

export interface OAuthResult {
  hostedUI?: boolean;
  hostedUIDomainName?: string;
  hostedUIProviderMeta?: $TSAny;
  hostedUIProviderCreds?: $TSAny;
  AllowedOAuthFlows?: 'code' | 'implicit';
  AllowedOAuthScopes?: string[];
  newCallbackURLs?: string[];
  newLogoutURLs?: string[];
  oAuthMetadata?: $TSAny;
}

export interface SocialProviderResult {
  authProvidersUserPool?: string[];
  facebookAppIdUserPool?: string;
  facebookAppSecretUserPool?: string;
  googleAppIdUserPool?: string;
  googleAppSecretUserPool?: string;
  loginwithamazonAppIdUserPool?: string;
  loginwithamazonAppSecretUserPool?: string;
  signinwithappleClientIdUserPool?: string;
  signinwithappleTeamIdUserPool?: string;
  signinwithappleKeyIdUserPool?: string;
  signinwithapplePrivateKeyUserPool?: string;
}

export interface IdentityPoolResult {
  thirdPartyAuth?: boolean;
  identityPoolName?: string;
  allowUnauthenticatedIdentities?: boolean;
  authProviders?: string[];
  googleClientId?: string;
  googleIos?: string;
  googleAndroid?: string;
  facebookAppId?: string;
  amazonAppId?: string;
  appleAppId?: string;
  selectedParties?: string; // serialized json
  audiences?: string[];
}

export interface PasswordRecoveryResult {
  emailVerificationMessage?: string;
  emailVerificationSubject?: string;
  smsVerificationMessage?: string;
  autoVerifiedAttributes?: string[];
}

export interface MfaResult {
  mfaConfiguration?: 'OPTIONAL' | 'ON' | 'OFF';
  mfaTypes?: ('SMS Text Message' | 'TOTP')[];
  smsAuthenticationMessage?: string;
}

export interface AdminQueriesResult {
  adminQueries?: boolean;
  adminQueryGroup?: string;
}

export interface PasswordPolicyResult {
  passwordPolicyCharacters?: PasswordPolicy[];
  passwordPolicyMinLength?: number | string;
}

export enum AttributeType {
  EMAIL = 'email',
  PHONE_NUMBER = 'phone_number',
  PREFERRED_USERNAME = 'preferred_username',
  EMAIL_AND_PHONE_NUMBER = 'email, phone_number',
}

export type PasswordPolicy = 'Requires Lowercase' | 'Requires Numbers' | 'Requires Symbols' | 'Requires Uppercase';

export type UsernameAttributes = AttributeType.EMAIL | AttributeType.PHONE_NUMBER | AttributeType.EMAIL_AND_PHONE_NUMBER;

export type AliasAttributes = AttributeType.EMAIL | AttributeType.PHONE_NUMBER | AttributeType.PREFERRED_USERNAME;

export interface Triggers {
  triggers?: any; // TODO create a type for this
}
