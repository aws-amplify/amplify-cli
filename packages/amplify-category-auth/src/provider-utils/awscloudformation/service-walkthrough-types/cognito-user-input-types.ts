// Some convenience types for the existing service walkthrough logic

import { $TSObject } from 'amplify-cli-core';
import { FunctionDependency } from 'amplify-function-plugin-interface';
import { CognitoConfiguration } from './awsCognito-user-input-types';

export type AuthTriggerPermissions = {
  policyName: string;
  trigger: string;
  effect: string;
  actions: string[];
  resource: {
    paramType: string;
    keys: string | string[];
  };
};

export type CognitoStackOptions = CognitoConfiguration & AuthStackMetadata;

type AuthStackMetadata = {
  authRoleArn: $TSObject;
  unauthRoleArn: $TSObject;
  dependsOn?: FunctionDependency[];
  parentStack?: string;
  breakCircularDependency: boolean;
  permissions?: AuthTriggerPermissions[];
  authTriggerConnections?: AuthTriggerConnection[];
  userAutoVerifiedAttributeUpdateSettings?: string[];
};

export type ServiceQuestionHeadlessResult = ServiceQuestionsBaseResult &
  OAuthResult &
  SocialProviderResult &
  IdentityPoolResult &
  PasswordPolicyResult &
  AutoVerifiedAttributesResult &
  MfaResult &
  AdminQueriesResult &
  Triggers;

export interface ServiceQuestionsBaseResult {
  serviceName: 'Cognito';
  resourceName?: string;
  useDefault: 'default' | 'defaultSocial' | 'manual';
  updateFlow?: 'default' | 'defaultSocial' | 'manual' | 'callbacks' | 'providers' | 'updateUserPoolGroups' | 'updateAdminQueries';
  requiredAttributes: string[];
  authSelections: 'userPoolOnly' | 'identityPoolAndUserPool' | 'identityPoolOnly';
  userPoolName?: string;
  usernameAttributes?: UsernameAttributes[];
  aliasAttributes?: AliasAttributes[];
  userPoolGroups?: boolean;
  userPoolGroupList?: string[];
  userpoolClientRefreshTokenValidity?: number;
  userpoolClientReadAttributes: string[];
  userpoolClientWriteAttributes: string[];
  userpoolClientSetAttributes?: boolean;
  usernameCaseSensitive?: boolean;
  useEnabledMfas?: boolean;
  authTriggerConnections?: string;
  verificationBucketName?: string;
  resourceNameTruncated?: string;
  sharedId?: string;
}

export interface OAuthResult {
  hostedUI?: boolean;
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
  authProviders: string[];
  googleClientId?: string;
  googleIos?: string;
  googleAndroid?: string;
  facebookAppId?: string;
  amazonAppId?: string;
  appleAppId?: string;
  selectedParties?: string; // serialized json
  audiences?: string[];
}

export interface AutoVerifiedAttributesResult {
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

export enum AttributeType {
  EMAIL = 'email',
  PHONE_NUMBER = 'phone_number',
  PREFERRED_USERNAME = 'preferred_username',
}

export type PasswordPolicy = 'Requires Lowercase' | 'Requires Numbers' | 'Requires Symbols' | 'Requires Uppercase';

export type UsernameAttributes = AttributeType.EMAIL | AttributeType.PHONE_NUMBER;

export type AliasAttributes = AttributeType.EMAIL | AttributeType.PHONE_NUMBER | AttributeType.PREFERRED_USERNAME;

export interface Triggers {
  triggers?: any; // TODO create a type for this
}

export enum TriggerType {
  CreateAuthChallenge = 'CreateAuthChallenge',
  CustomMessage = 'CustomMessage',
  DefineAuthChallenge = 'DefineAuthChallenge',
  PostAuthentication = 'PostAuthentication',
  PostConfirmation = 'PostConfirmation',
  PreAuthentication = 'PreAuthentication',
  PreSignup = 'PreSignUp',
  VerifyAuthChallengeResponse = 'VerifyAuthChallengeResponse',
  PreTokenGeneration = 'PreTokenGeneration',
}

export type AuthTriggerConnection = {
  lambdaFunctionName: string;
  triggerType: string;
  lambdaFunctionArn?: string;
};

export type AuthTriggerConfig = {
  triggers: $TSObject;
  authTriggerConnections: AuthTriggerConnection[];
};
