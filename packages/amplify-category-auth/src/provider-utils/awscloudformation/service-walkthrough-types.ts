// Some convenience types for the existing service walkthrough logic

export type ServiceQuestionsResult = ServiceQuestionsBaseResult &
  OAuthResult &
  SocialProviderResult &
  IdentityPoolResult &
  PasswordPolicyResult &
  PasswordRecoveryResult &
  MfaResult &
  AdminQueriesResult;

export interface ServiceQuestionsBaseResult {
  serviceName: string;
  resourceName?: string;
  useDefault: 'manual';
  requiredAttributes: string[];
  authSelections: 'userPoolOnly' | 'identityPoolAndUserPool';
  userPoolName?: string;
  usernameAttributes?: UsernameAttributes;
  userPoolGroups: boolean;
  userPoolGroupList?: string[];
  userpoolClientRefreshTokenValidity?: number;
  userpoolClientReadAttributes: string[];
  userpoolClientWriteAttributes: string[];
}

export interface OAuthResult {
  hostedUI: boolean;
  hostedUIDomainName?: string;
  hostedUIProviderMeta?: any;
  hostedUIProviderCreds?: any;
  AllowedOAuthFlows?: 'code' | 'implicit';
  AllowedOAuthScopes?: string[];
  newCallbackURLs?: string[];
  newLogoutURLs?: string[];
  oAuthMetadata?: any;
}

export interface SocialProviderResult {
  authProvidersUserPool?: string[];
  facebookAppIdUserPool?: string;
  facebookAppSecretUserPool?: string;
  oidcAppIdUserPool?: string;
  oidcAppSecretUserPool?: string;
  googleAppIdUserPool?: string;
  googleAppSecretUserPool?: string;
  loginwithamazonAppIdUserPool?: string;
  loginwithamazonAppSecretUserPool?: string;
}

export interface IdentityPoolResult {
  thirdPartyAuth: boolean;
  identityPoolName?: string;
  allowUnauthenticatedIdentities?: boolean;
  authProviders: string[];
  googleClientId?: string;
  googleIos?: string;
  googleAndroid?: string;
  facebookAppId?: string;
  amazonAppId?: string;
  oidcAppId?: string;
  selectedParties?: string; // serialized json
  audiences?: string[];
}

export interface PasswordRecoveryResult {
  emailVerificationMessage?: string;
  emailVerificationSubject?: string;
  smsVerificationMessage?: string;
  autoVerifiedAttributes: string[];
}

export interface MfaResult {
  mfaConfiguration: 'OPTIONAL' | 'ON' | 'OFF';
  mfaTypes?: ('SMS Text Message' | 'TOTP')[];
  smsAuthenticationMessage?: string;
}

export interface AdminQueriesResult {
  adminQueries: boolean;
  adminQueryGroup?: string;
}

export interface PasswordPolicyResult {
  passwordPolicyCharacters?: PasswordPolicy[];
  passwordPolicyMinLength?: number;
}

export type PasswordPolicy = 'Requires Lowercase' | 'Requires Numbers' | 'Requires Symbols' | 'Requires Uppercase';

export type UsernameAttributes = 'username' | 'email' | 'phone_number' | 'email, phone_number';

export enum TriggerType {
  CreateAuthChallenge = 'CreateAuthChallenge',
  CustomMessage = 'CustomMessage',
  DefineAuthChallenge = 'DefineAuthChallenge',
  PostAuthentication = 'PostAuthentication',
  PostConfirmation = 'PostConfirmation',
  PreAuthentication = 'PreAuthentication',
  PreSignup = 'PreSignup',
  VerifyAuthChallengeResponse = 'VerifyAuthChallengeResponse',
  PreTokenGeneration = 'PreTokenGeneration',
}
