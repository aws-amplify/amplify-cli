import ts from 'typescript';
import { PasswordPolicyType, UserPoolClientType } from '@aws-sdk/client-cognito-identity-provider';
import { Lambda } from '../functions/lambda';
export type Scope = 'PHONE' | 'EMAIL' | 'OPENID' | 'PROFILE' | 'COGNITO_ADMIN';
export type StandardAttribute = {
  readonly mutable?: boolean;
  readonly required?: boolean;
};
export type CustomAttribute = {
  readonly dataType: string | undefined;
  readonly mutable?: boolean;
  minLen?: number;
  maxLen?: number;
  min?: number;
  max?: number;
};
export type Attribute =
  | 'address'
  | 'birthdate'
  | 'email'
  | 'familyName'
  | 'gender'
  | 'givenName'
  | 'locale'
  | 'middleName'
  | 'fullname'
  | 'nickname'
  | 'phoneNumber'
  | 'profilePicture'
  | 'preferredUsername'
  | 'profilePage'
  | 'timezone'
  | 'lastUpdateTime'
  | 'website';
export type AttributeMappingRule = Record<Attribute, string>;
export type SendingAccount = 'COGNITO_DEFAULT' | 'DEVELOPER';
export type UserPoolMfaConfig = 'OFF' | 'REQUIRED' | 'OPTIONAL';
export type PasswordPolicyPath = `Policies.PasswordPolicy.${keyof PasswordPolicyType}`;
export type PolicyOverrides = Partial<Record<PasswordPolicyPath | string, string | boolean | number | string[]>>;
export type EmailOptions = {
  emailVerificationBody: string;
  emailVerificationSubject: string;
};
export type StandardAttributes = Partial<Record<Attribute, StandardAttribute>>;
export type CustomAttributes = Partial<Record<`custom:${string}`, CustomAttribute>>;
export type Group = string;
export type MetadataOptions = {
  metadataContent: string;
  metadataType: 'URL' | 'FILE';
};
export type SamlOptions = {
  name?: string;
  metadata: MetadataOptions;
  attributeMapping?: AttributeMappingRule;
};
export type OidcEndPoints = {
  authorization?: string;
  token?: string;
  userInfo?: string;
  jwksUri?: string;
};
export type OidcOptions = {
  issuerUrl: string;
  name?: string;
  endpoints?: OidcEndPoints;
  attributeMapping?: AttributeMappingRule;
};
export type LoginOptions = {
  email?: boolean;
  phone?: boolean;
  emailOptions?: Partial<EmailOptions>;
  googleLogin?: boolean;
  amazonLogin?: boolean;
  appleLogin?: boolean;
  facebookLogin?: boolean;
  oidcLogin?: OidcOptions[];
  samlLogin?: SamlOptions;
  googleAttributes?: AttributeMappingRule;
  amazonAttributes?: AttributeMappingRule;
  appleAttributes?: AttributeMappingRule;
  facebookAttributes?: AttributeMappingRule;
  callbackURLs?: string[];
  logoutURLs?: string[];
  scopes?: Scope[];
  [key: string]: boolean | Partial<EmailOptions> | string[] | Scope[] | OidcOptions[] | SamlOptions | AttributeMappingRule | undefined;
};
export type MultifactorOptions = {
  mode: UserPoolMfaConfig;
  totp?: boolean;
  sms?: boolean;
};
export type AuthLambdaTriggers = Record<AuthTriggerEvents, Lambda>;
export type AuthTriggerEvents =
  | 'createAuthChallenge'
  | 'customMessage'
  | 'defineAuthChallenge'
  | 'postAuthentication'
  | 'postConfirmation'
  | 'preAuthentication'
  | 'preSignUp'
  | 'preTokenGeneration'
  | 'userMigration'
  | 'verifyAuthChallengeResponse';
export type ReferenceAuth = {
  userPoolId?: string;
  identityPoolId?: string;
  authRoleArn?: string;
  unauthRoleArn?: string;
  userPoolClientId?: string;
  groups?: Record<string, string>;
};
export interface AuthDefinition {
  loginOptions?: LoginOptions;
  groups?: Group[];
  mfa?: MultifactorOptions;
  standardUserAttributes?: StandardAttributes;
  customUserAttributes?: CustomAttributes;
  userPoolOverrides?: PolicyOverrides;
  lambdaTriggers?: Partial<AuthLambdaTriggers>;
  guestLogin?: boolean;
  identityPoolName?: string;
  oAuthFlows?: string[];
  readAttributes?: string[];
  writeAttributes?: string[];
  referenceAuth?: ReferenceAuth;
  userPoolClient?: UserPoolClientType;
}
export declare function renderAuthNode(definition: AuthDefinition): ts.NodeArray<ts.Node>;
//# sourceMappingURL=index.d.ts.map
