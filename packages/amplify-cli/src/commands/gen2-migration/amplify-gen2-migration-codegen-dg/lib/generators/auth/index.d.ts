import ts from 'typescript';
import { PasswordPolicyType, UserPoolClientType } from '@aws-sdk/client-cognito-identity-provider';
import { Lambda } from '../functions/lambda';
/** OAuth 2.0 scopes supported by Cognito User Pools */
export type Scope = 'PHONE' | 'EMAIL' | 'OPENID' | 'PROFILE' | 'COGNITO_ADMIN';
/** Configuration for standard Cognito user attributes */
export type StandardAttribute = {
  /** Whether the attribute can be modified after user creation */
  readonly mutable?: boolean;
  /** Whether the attribute is required during user registration */
  readonly required?: boolean;
};
/** Configuration for custom user attributes with validation constraints */
export type CustomAttribute = {
  /** Data type of the custom attribute (String, Number, DateTime, Boolean) */
  readonly dataType: string | undefined;
  /** Whether the attribute can be modified after user creation */
  readonly mutable?: boolean;
  /** String attribute constraints */
  /** Minimum length for string attributes */
  minLen?: number;
  /** Maximum length for string attributes */
  maxLen?: number;
  /** Number attribute constraints */
  /** Minimum value for number attributes */
  min?: number;
  /** Maximum value for number attributes */
  max?: number;
};
/** Standard user attributes supported by Cognito User Pools */
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
/** Maps standard attributes to external provider attribute names */
export type AttributeMappingRule = Record<Attribute, string>;
/** Email sending account configuration for Cognito */
export type SendingAccount = 'COGNITO_DEFAULT' | 'DEVELOPER';
/** Multi-factor authentication configuration modes */
export type UserPoolMfaConfig = 'OFF' | 'REQUIRED' | 'OPTIONAL';
/** Type-safe paths for password policy overrides */
export type PasswordPolicyPath = `Policies.PasswordPolicy.${keyof PasswordPolicyType}`;
/** CloudFormation policy overrides for User Pool configuration */
export type PolicyOverrides = Partial<Record<PasswordPolicyPath | string, string | boolean | number | string[]>>;
/** Email verification message customization */
export type EmailOptions = {
  /** Custom email verification message body */
  emailVerificationBody: string;
  /** Custom email verification subject line */
  emailVerificationSubject: string;
};
/** Collection of standard user attributes with their configurations */
export type StandardAttributes = Partial<Record<Attribute, StandardAttribute>>;
/** Collection of custom user attributes with their configurations */
export type CustomAttributes = Partial<Record<`custom:${string}`, CustomAttribute>>;
/** User group name */
export type Group = string;
/** SAML metadata configuration options */
export type MetadataOptions = {
  /** SAML metadata content (URL or file content) */
  metadataContent: string;
  /** Type of metadata source */
  metadataType: 'URL' | 'FILE';
};
/** SAML identity provider configuration */
export type SamlOptions = {
  /** Optional name for the SAML provider */
  name?: string;
  /** SAML metadata configuration */
  metadata: MetadataOptions;
  /** Attribute mapping from SAML to Cognito attributes */
  attributeMapping?: AttributeMappingRule;
};
/** OpenID Connect endpoint URLs */
export type OidcEndPoints = {
  /** Authorization endpoint URL */
  authorization?: string;
  /** Token endpoint URL */
  token?: string;
  /** User info endpoint URL */
  userInfo?: string;
  /** JSON Web Key Set URI */
  jwksUri?: string;
};
/** OpenID Connect identity provider configuration */
export type OidcOptions = {
  /** OIDC issuer URL */
  issuerUrl: string;
  /** Optional name for the OIDC provider */
  name?: string;
  /** Custom OIDC endpoints (optional, auto-discovered if not provided) */
  endpoints?: OidcEndPoints;
  /** Attribute mapping from OIDC to Cognito attributes */
  attributeMapping?: AttributeMappingRule;
};
/** Comprehensive login configuration options */
export type LoginOptions = {
  /** Enable email-based login */
  email?: boolean;
  /** Enable phone number-based login */
  phone?: boolean;
  /** Custom email verification settings */
  emailOptions?: Partial<EmailOptions>;
  /** Enable Google social login */
  googleLogin?: boolean;
  /** Enable Amazon social login */
  amazonLogin?: boolean;
  /** Enable Apple Sign In */
  appleLogin?: boolean;
  /** Enable Facebook social login */
  facebookLogin?: boolean;
  /** OpenID Connect providers configuration */
  oidcLogin?: OidcOptions[];
  /** SAML identity provider configuration */
  samlLogin?: SamlOptions;
  /** Google attribute mapping */
  googleAttributes?: AttributeMappingRule;
  /** Amazon attribute mapping */
  amazonAttributes?: AttributeMappingRule;
  /** Apple attribute mapping */
  appleAttributes?: AttributeMappingRule;
  /** Facebook attribute mapping */
  facebookAttributes?: AttributeMappingRule;
  /** OAuth callback URLs */
  callbackURLs?: string[];
  /** OAuth logout URLs */
  logoutURLs?: string[];
  /** OAuth scopes to request */
  scopes?: Scope[];
  /** Index signature for extensibility */
  [key: string]: boolean | Partial<EmailOptions> | string[] | Scope[] | OidcOptions[] | SamlOptions | AttributeMappingRule | undefined;
};
/** Multi-factor authentication configuration */
export type MultifactorOptions = {
  /** MFA enforcement mode */
  mode: UserPoolMfaConfig;
  /** Enable Time-based One-Time Password (TOTP) */
  totp?: boolean;
  /** Enable SMS-based MFA */
  sms?: boolean;
};
/** Lambda triggers for Cognito User Pool events */
export type AuthLambdaTriggers = Record<AuthTriggerEvents, Lambda>;
/** Cognito User Pool Lambda trigger event types */
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
/** Configuration for referencing existing auth resources */
export type ReferenceAuth = {
  /** Existing Cognito User Pool ID */
  userPoolId?: string;
  /** Existing Cognito Identity Pool ID */
  identityPoolId?: string;
  /** IAM role ARN for authenticated users */
  authRoleArn?: string;
  /** IAM role ARN for unauthenticated users */
  unauthRoleArn?: string;
  /** Existing User Pool Client ID */
  userPoolClientId?: string;
  /** Existing user groups mapping */
  groups?: Record<string, string>;
};
/**
 * Complete authentication configuration definition
 *
 * This interface represents the full auth configuration that will be
 * transformed into Gen 2 TypeScript code. It encompasses all possible
 * auth features including login methods, MFA, user attributes, Lambda
 * triggers, and external provider integration.
 */
export interface AuthDefinition {
  /** Login method configurations */
  loginOptions?: LoginOptions;
  /** User groups to create */
  groups?: Group[];
  /** Multi-factor authentication settings */
  mfa?: MultifactorOptions;
  /** Standard Cognito user attributes */
  standardUserAttributes?: StandardAttributes;
  /** Custom user attributes */
  customUserAttributes?: CustomAttributes;
  /** CloudFormation policy overrides */
  userPoolOverrides?: PolicyOverrides;
  /** Lambda function triggers */
  lambdaTriggers?: Partial<AuthLambdaTriggers>;
  /** Enable unauthenticated access */
  guestLogin?: boolean;
  /** Custom Identity Pool name */
  identityPoolName?: string;
  /** OAuth 2.0 flows to enable */
  oAuthFlows?: string[];
  /** Attributes that can be read */
  readAttributes?: string[];
  /** Attributes that can be written */
  writeAttributes?: string[];
  /** Reference to existing auth resources */
  referenceAuth?: ReferenceAuth;
  /** Existing User Pool Client configuration */
  userPoolClient?: UserPoolClientType;
}
export declare function renderAuthNode(definition: AuthDefinition): ts.NodeArray<ts.Node>;
//# sourceMappingURL=index.d.ts.map
