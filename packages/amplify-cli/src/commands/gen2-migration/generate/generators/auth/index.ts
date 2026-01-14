// Auth generator - creates Gen 2 auth TypeScript files
// Logic from amplify-gen2-codegen auth module
import ts, { PropertyAssignment } from 'typescript';
import assert from 'node:assert';
import { PasswordPolicyType, UserPoolClientType } from '@aws-sdk/client-cognito-identity-provider';
import { renderResourceTsFile } from '../../resource/resource';
import { createTriggersProperty, Lambda } from '../functions/lambda';
import { FunctionDefinition } from '../functions/index';
import { parseAuthAccessFromTemplate } from '../../codegen-head/auth_access_analyzer';

/** OAuth 2.0 scopes supported by Cognito User Pools */
export type Scope = 'phone' | 'email' | 'openid' | 'profile' | 'aws.cognito.signin.user.admin';

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
  /** OAuth scopes to request (DEPRECATED: use provider-specific scopes) */
  scopes?: Scope[];
  /** Google-specific OAuth scopes */
  googleScopes?: string[];
  /** Facebook-specific OAuth scopes */
  facebookScopes?: string[];
  /** Amazon-specific OAuth scopes */
  amazonScopes?: string[];
  /** Apple-specific OAuth scopes */
  appleScopes?: string[];
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
  | 'createAuthChallenge' // Create custom auth challenge
  | 'customMessage' // Customize verification messages
  | 'defineAuthChallenge' // Define custom auth flow
  | 'postAuthentication' // Post-authentication processing
  | 'postConfirmation' // Post-confirmation processing
  | 'preAuthentication' // Pre-authentication validation
  | 'preSignUp' // Pre-registration validation
  | 'preTokenGeneration' // Customize JWT tokens
  | 'userMigration' // Migrate users from external systems
  | 'verifyAuthChallengeResponse'; // Verify custom auth challenge

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

// TypeScript AST factory for creating nodes
const factory = ts.factory;

// Secret management identifier for Gen 2
const secretIdentifier = factory.createIdentifier('secret');

// Social provider secret key constants
/** Google OAuth credentials */
const googleClientID = 'GOOGLE_CLIENT_ID';
const googleClientSecret = 'GOOGLE_CLIENT_SECRET';

/** Amazon Login with Amazon credentials */
const amazonClientID = 'LOGINWITHAMAZON_CLIENT_ID';
const amazonClientSecret = 'LOGINWITHAMAZON_CLIENT_SECRET';

/** Facebook Login credentials */
const facebookClientID = 'FACEBOOK_CLIENT_ID';
const facebookClientSecret = 'FACEBOOK_CLIENT_SECRET';

/** Apple Sign In With Apple credentials */
const appleClientID = 'SIWA_CLIENT_ID';
const appleKeyId = 'SIWA_KEY_ID';
const applePrivateKey = 'SIWA_PRIVATE_KEY';
const appleTeamID = 'SIWA_TEAM_ID';

/** OpenID Connect credentials */
const oidcClientID = 'OIDC_CLIENT_ID';
const oidcClientSecret = 'OIDC_CLIENT_SECRET';

/**
 * Creates TypeScript AST for social provider configuration
 *
 * Generates object literal with secret() calls for credentials and
 * optional attribute mapping configuration.
 *
 * @example
 * ```typescript
 * // Input:
 * config = { clientId: 'GOOGLE_CLIENT_ID', clientSecret: 'GOOGLE_CLIENT_SECRET' }
 * attributeMapping = { email: 'email', name: 'name' }
 *
 * // Output (TypeScript code):
 * {
 *   clientId: secret('GOOGLE_CLIENT_ID'),
 *   clientSecret: secret('GOOGLE_CLIENT_SECRET'),
 *   attributeMapping: {
 *     email: 'email',
 *     name: 'name'
 *   }
 * }
 * ```
 *
 * @param config - Provider credentials (clientId, clientSecret, etc.)
 * @param attributeMapping - Optional mapping of provider attributes to Cognito attributes
 * @returns Array of TypeScript property assignments
 */

function createProviderConfig(config: Record<string, string>, attributeMapping: AttributeMappingRule | undefined) {
  const properties: ts.ObjectLiteralElementLike[] = [];

  Object.entries(config).map(([key, value]) => {
    if (key === 'scopes') {
      // Handle scopes as an array of strings, not a secret
      const scopeArray = value.split(' ').filter((scope) => scope.length > 0);
      properties.push(
        factory.createPropertyAssignment(
          factory.createIdentifier('scopes'),
          factory.createArrayLiteralExpression(scopeArray.map((scope) => factory.createStringLiteral(scope))),
        ),
      );
    } else {
      // Handle other config values as secrets
      properties.push(
        factory.createPropertyAssignment(
          factory.createIdentifier(key),
          factory.createCallExpression(secretIdentifier, undefined, [factory.createStringLiteral(value)]),
        ),
      );
    }
  });

  if (attributeMapping) {
    const mappingProperties: ts.ObjectLiteralElementLike[] = [];

    Object.entries(attributeMapping).map(([key, value]) =>
      mappingProperties.push(factory.createPropertyAssignment(factory.createIdentifier(key), factory.createStringLiteral(value))),
    );

    properties.push(
      factory.createPropertyAssignment(
        factory.createIdentifier('attributeMapping'),
        factory.createObjectLiteralExpression(mappingProperties, true),
      ),
    );
  }

  return properties;
}

/**
 * Creates a property assignment for a social login provider
 *
 * @example
 * ```typescript
 * // Input:
 * createProviderPropertyAssignment('google',
 *   { clientId: 'GOOGLE_CLIENT_ID', clientSecret: 'GOOGLE_CLIENT_SECRET' },
 *   { email: 'email' }
 * )
 *
 * // Output (TypeScript code):
 * google: {
 *   clientId: secret('GOOGLE_CLIENT_ID'),
 *   clientSecret: secret('GOOGLE_CLIENT_SECRET'),
 *   attributeMapping: {
 *     email: 'email'
 *   }
 * }
 * ```
 *
 * @param name - Provider name (e.g., 'google', 'facebook')
 * @param config - Provider configuration (credentials)
 * @param attributeMapping - Optional attribute mapping
 * @returns TypeScript property assignment for the provider
 */
function createProviderPropertyAssignment(
  name: string,
  config: Record<string, string>,
  attributeMapping: AttributeMappingRule | undefined,
) {
  return factory.createPropertyAssignment(
    factory.createIdentifier(name),
    factory.createObjectLiteralExpression(createProviderConfig(config, attributeMapping), true),
  );
}

/**
 * Creates property assignments for OIDC/SAML provider configuration
 *
 * Recursively processes nested configuration objects to create
 * TypeScript AST nodes for complex provider settings.
 *
 * @example
 * ```typescript
 * // Input:
 * config = {
 *   issuerUrl: 'https://example.com',
 *   endpoints: {
 *     authorization: 'https://example.com/auth',
 *     token: 'https://example.com/token'
 *   }
 * }
 *
 * // Output (TypeScript code):
 * {
 *   issuerUrl: 'https://example.com',
 *   endpoints: {
 *     authorization: 'https://example.com/auth',
 *     token: 'https://example.com/token'
 *   }
 * }
 * ```
 *
 * @param config - OIDC/SAML configuration object
 * @returns Array of TypeScript property assignments
 */
function createOidcSamlPropertyAssignments(
  config: Record<string, string | MetadataOptions | OidcEndPoints | AttributeMappingRule>,
): PropertyAssignment[] {
  return Object.entries(config).flatMap(([key, value]) => {
    if (typeof value === 'string') {
      return [factory.createPropertyAssignment(factory.createIdentifier(key), factory.createStringLiteral(value))];
    } else if (typeof value === 'object' && value !== null) {
      return [
        factory.createPropertyAssignment(
          factory.createIdentifier(key),
          factory.createObjectLiteralExpression(createOidcSamlPropertyAssignments(value), true),
        ),
      ];
    }
    return [];
  });
}

/**
 * Creates the externalProviders configuration for social login
 *
 * This is the main function that orchestrates the creation of all
 * external authentication providers (Google, Apple, Facebook, Amazon,
 * OIDC, SAML) based on the login options provided.
 *
 * @example
 * ```typescript
 * // Input:
 * loginOptions = { googleLogin: true, facebookLogin: true, scopes:['email', 'profile', 'openid'] }
 *
 * // Output (TypeScript code):
 * externalProviders: {
 *   google: {
 *     clientId: secret('GOOGLE_CLIENT_ID'),
 *     clientSecret: secret('GOOGLE_CLIENT_SECRET')
 *   },
 *   facebook: {
 *     clientId: secret('FACEBOOK_CLIENT_ID'),
 *     clientSecret: secret('FACEBOOK_CLIENT_SECRET')
 *   },
 *   scopes: ['email', 'profile', 'openid']
 * }
 * ```
 *
 * @param loginOptions - Login configuration with provider flags
 * @param callbackUrls - OAuth callback URLs
 * @param logoutUrls - OAuth logout URLs
 * @param secretErrors - Array to collect secret error statements
 * @returns TypeScript object literal expression for externalProviders
 */
function createExternalProvidersPropertyAssignment(
  loginOptions: LoginOptions,
  callbackUrls?: string[],
  logoutUrls?: string[],
  secretErrors?: ts.Node[],
) {
  const providerAssignments: PropertyAssignment[] = [];

  if (loginOptions.googleLogin) {
    const googleConfig: Record<string, string> = {
      clientId: googleClientID,
      clientSecret: googleClientSecret,
    };

    // Add provider-specific scopes if available
    if (loginOptions.googleScopes && loginOptions.googleScopes.length > 0) {
      googleConfig.scopes = loginOptions.googleScopes.join(' ');
    }

    providerAssignments.push(createProviderPropertyAssignment('google', googleConfig, loginOptions.googleAttributes));
    // secretErrors?.push(...createSecretErrorStatements([googleClientID, googleClientSecret]));
  }

  if (loginOptions.appleLogin) {
    const appleConfig: Record<string, string> = {
      clientId: appleClientID,
      keyId: appleKeyId,
      privateKey: applePrivateKey,
      teamId: appleTeamID,
    };

    // Add provider-specific scopes if available
    if (loginOptions.appleScopes && loginOptions.appleScopes.length > 0) {
      appleConfig.scopes = loginOptions.appleScopes.join(' ');
    }

    providerAssignments.push(createProviderPropertyAssignment('signInWithApple', appleConfig, loginOptions.appleAttributes));
    // secretErrors?.push(...createSecretErrorStatements([appleClientID, appleKeyId, applePrivateKey, appleTeamID]));
  }

  if (loginOptions.amazonLogin) {
    const amazonConfig: Record<string, string> = {
      clientId: amazonClientID,
      clientSecret: amazonClientSecret,
    };

    // Add provider-specific scopes if available
    if (loginOptions.amazonScopes && loginOptions.amazonScopes.length > 0) {
      amazonConfig.scopes = loginOptions.amazonScopes.join(' ');
    }

    providerAssignments.push(createProviderPropertyAssignment('loginWithAmazon', amazonConfig, loginOptions.amazonAttributes));
    // secretErrors?.push(...createSecretErrorStatements([amazonClientID, amazonClientSecret]));
  }

  if (loginOptions.facebookLogin) {
    const facebookConfig: Record<string, string> = {
      clientId: facebookClientID,
      clientSecret: facebookClientSecret,
    };

    // Add provider-specific scopes if available
    if (loginOptions.facebookScopes && loginOptions.facebookScopes.length > 0) {
      facebookConfig.scopes = loginOptions.facebookScopes.join(' ');
    }

    providerAssignments.push(createProviderPropertyAssignment('facebook', facebookConfig, loginOptions.facebookAttributes));
    // secretErrors?.push(...createSecretErrorStatements([facebookClientID, facebookClientSecret]));
  }

  if (loginOptions.samlLogin) {
    providerAssignments.push(
      factory.createPropertyAssignment(
        factory.createIdentifier('saml'),
        factory.createObjectLiteralExpression(createOidcSamlPropertyAssignments(loginOptions.samlLogin), true),
      ),
    );
  }

  if (loginOptions.oidcLogin && loginOptions.oidcLogin.length > 0) {
    providerAssignments.push(
      factory.createPropertyAssignment(
        factory.createIdentifier('oidc'),
        factory.createArrayLiteralExpression(
          loginOptions.oidcLogin.map((oidc, index) =>
            factory.createObjectLiteralExpression(
              [
                factory.createPropertyAssignment(
                  factory.createIdentifier('clientId'),
                  factory.createCallExpression(secretIdentifier, undefined, [factory.createStringLiteral(`${oidcClientID}_${index + 1}`)]),
                ),
                factory.createPropertyAssignment(
                  factory.createIdentifier('clientSecret'),
                  factory.createCallExpression(secretIdentifier, undefined, [
                    factory.createStringLiteral(`${oidcClientSecret}_${index + 1}`),
                  ]),
                ),
                ...createOidcSamlPropertyAssignments(oidc),
              ],
              true,
            ),
          ),
          true,
        ),
      ),
    );
    // secretErrors?.push(...createSecretErrorStatements([oidcClientID, oidcClientSecret]));
  }

  // REMOVED: Global scopes are no longer used - provider-specific scopes are now embedded in each provider config

  // supports callback urls and logout urls
  const properties = [
    ...providerAssignments,
    factory.createPropertyAssignment(
      factory.createIdentifier('callbackUrls'),
      factory.createArrayLiteralExpression(callbackUrls?.map((url) => factory.createStringLiteral(url))),
    ),
    factory.createPropertyAssignment(
      factory.createIdentifier('logoutUrls'),
      factory.createArrayLiteralExpression(logoutUrls?.map((url) => factory.createStringLiteral(url))),
    ),
  ];

  return factory.createObjectLiteralExpression(properties, true);
}

/**
 * Creates the loginWith property assignment for auth configuration
 *
 * Processes email/phone login options and integrates external providers.
 * Handles custom email verification settings and creates the complete
 * loginWith configuration object.
 *
 * @param logInDefinition - Login options configuration
 * @param secretErrors - Array to collect secret error statements
 * @returns TypeScript property assignment for loginWith
 */
function createLogInWithPropertyAssignment(logInDefinition: LoginOptions = {}, secretErrors: ts.Node[]) {
  const logInWith = factory.createIdentifier('loginWith');
  const assignments: ts.ObjectLiteralElementLike[] = [];
  if (logInDefinition.email === true && typeof logInDefinition.emailOptions === 'object') {
    // Handle both email: true AND emailOptions
    const emailDefinitionAssignments: ts.ObjectLiteralElementLike[] = [];

    if (logInDefinition.emailOptions?.emailVerificationSubject) {
      emailDefinitionAssignments.push(
        factory.createPropertyAssignment(
          'verificationEmailSubject',
          factory.createStringLiteral(logInDefinition.emailOptions.emailVerificationSubject),
        ),
      );
    }
    if (logInDefinition.emailOptions?.emailVerificationBody) {
      emailDefinitionAssignments.push(
        factory.createPropertyAssignment(
          'verificationEmailBody',
          factory.createArrowFunction(
            undefined,
            undefined,
            [],
            undefined,
            undefined,
            factory.createStringLiteral(logInDefinition.emailOptions.emailVerificationBody),
          ),
        ),
      );
    }
    const emailDefinitionObject = factory.createObjectLiteralExpression(emailDefinitionAssignments, true);
    assignments.push(factory.createPropertyAssignment(factory.createIdentifier('email'), emailDefinitionObject));
  } else if (logInDefinition.email === true) {
    assignments.push(factory.createPropertyAssignment(factory.createIdentifier('email'), factory.createTrue()));
  }
  // Custom email messages to send to the user on verification
  else if (typeof logInDefinition.emailOptions === 'object') {
    const emailDefinitionAssignments: ts.ObjectLiteralElementLike[] = [];

    if (logInDefinition.emailOptions?.emailVerificationSubject) {
      emailDefinitionAssignments.push(
        factory.createPropertyAssignment(
          'verificationEmailSubject',
          factory.createStringLiteral(logInDefinition.emailOptions.emailVerificationSubject),
        ),
      );
    }
    if (logInDefinition.emailOptions?.emailVerificationBody) {
      emailDefinitionAssignments.push(
        factory.createPropertyAssignment(
          'verificationEmailBody',
          factory.createArrowFunction(
            undefined,
            undefined,
            [],
            undefined,
            undefined,
            factory.createStringLiteral(logInDefinition.emailOptions.emailVerificationBody),
          ),
        ),
      );
    }
    const emailDefinitionObject = factory.createObjectLiteralExpression(emailDefinitionAssignments, true);
    assignments.push(factory.createPropertyAssignment(factory.createIdentifier('email'), emailDefinitionObject));
  }
  if (logInDefinition.phone === true) {
    assignments.push(factory.createPropertyAssignment(factory.createIdentifier('phone'), factory.createTrue()));
  }
  if (
    logInDefinition.amazonLogin ||
    logInDefinition.googleLogin ||
    logInDefinition.facebookLogin ||
    logInDefinition.appleLogin ||
    (logInDefinition.oidcLogin && logInDefinition.oidcLogin.length > 0) ||
    logInDefinition.samlLogin
  ) {
    assignments.push(
      factory.createPropertyAssignment(
        factory.createIdentifier('externalProviders'),
        createExternalProvidersPropertyAssignment(logInDefinition, logInDefinition.callbackURLs, logInDefinition.logoutURLs, secretErrors),
      ),
    );
  }
  return factory.createPropertyAssignment(logInWith, factory.createObjectLiteralExpression(assignments, true));
}

/**
 * Creates TypeScript AST for user attribute definition
 *
 * Converts attribute configuration objects into TypeScript property
 * assignments, handling boolean, string, and number values.
 *
 * @param attribute - Standard or custom attribute configuration
 * @returns TypeScript object literal expression for the attribute
 */
const createStandardAttributeDefinition = (attribute: StandardAttribute | CustomAttribute) => {
  const properties: ts.PropertyAssignment[] = [];

  for (const key of Object.keys(attribute)) {
    const value = attribute[key as keyof (StandardAttribute | CustomAttribute)];

    if (typeof value === 'boolean') {
      properties.push(
        factory.createPropertyAssignment(factory.createIdentifier(key), value ? factory.createTrue() : factory.createFalse()),
      );
    } else if (typeof value === 'string') {
      properties.push(factory.createPropertyAssignment(factory.createIdentifier(key), factory.createStringLiteral(value)));
    } else if (typeof value === 'number') {
      properties.push(factory.createPropertyAssignment(factory.createIdentifier(key), factory.createNumericLiteral(value)));
    }
  }

  return factory.createObjectLiteralExpression(properties, true);
};

/**
 * Creates the userAttributes property assignment
 *
 * Combines standard and custom user attributes into a single
 * userAttributes configuration object for the auth definition.
 *
 * @param standardAttributes - Standard Cognito attributes configuration
 * @param customAttributes - Custom attributes configuration
 * @returns TypeScript property assignment for userAttributes
 */
const createUserAttributeAssignments = (
  standardAttributes: StandardAttributes | undefined,
  customAttributes: CustomAttributes | undefined,
) => {
  const userAttributeIdentifier = factory.createIdentifier('userAttributes');
  const userAttributeProperties = [];
  if (standardAttributes !== undefined) {
    const standardAttributeProperties = Object.entries(standardAttributes).map(([key, value]) => {
      return factory.createPropertyAssignment(factory.createIdentifier(key), createStandardAttributeDefinition(value));
    });
    userAttributeProperties.push(...standardAttributeProperties);
  }
  if (customAttributes !== undefined) {
    const customAttributeProperties = Object.entries(customAttributes)
      .map(([key, value]) => {
        if (value !== undefined) {
          return factory.createPropertyAssignment(factory.createStringLiteral(key), createStandardAttributeDefinition(value));
        }
        return undefined;
      })
      .filter((property): property is ts.PropertyAssignment => property !== undefined);
    userAttributeProperties.push(...customAttributeProperties);
  }
  return factory.createPropertyAssignment(userAttributeIdentifier, factory.createObjectLiteralExpression(userAttributeProperties, true));
};

// eslint-disable-next-line spellcheck/spell-checker
/**
 * Creates error statements for missing secrets
 *
 * Generates throw statements that provide helpful error messages
 * with CLI commands to set missing secrets.
 *
 // eslint-disable-next-line spellcheck/spell-checker
 * @example
 * ```typescript
 * // Input:
 * createSecretErrorStatements(['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'])
 *
 * // Output (TypeScript code):
 * throw new Error('Secrets need to be reset, use `npx ampx sandbox secret set GOOGLE_CLIENT_ID` to set the value');
 * throw new Error('Secrets need to be reset, use `npx ampx sandbox secret set GOOGLE_CLIENT_SECRET` to set the value');
 * ```
 *
 * @param secretVariables - Array of secret variable names
 * @returns Array of TypeScript throw statement nodes
 */
function createSecretErrorStatements(secretVariables: string[]): ts.Node[] {
  return secretVariables.map((secret) =>
    factory.createCallExpression(factory.createIdentifier('throw new Error'), undefined, [
      // eslint-disable-next-line spellcheck/spell-checker
      factory.createStringLiteral(
        `Secrets need to be reset, use \`npx ampx sandbox secret set ${secret}\` to set the value. Do not deploy unless this is done`,
      ),
    ]),
  );
}

export function renderAuthNode(
  definition: AuthDefinition,
  functions?: FunctionDefinition[],
  functionCategories?: Map<string, string>,
): ts.NodeArray<ts.Node> {
  // Track required imports from various packages
  //  Creates the data structure to track imports. Extracts reference auth config
  const namedImports: { [importedPackageName: string]: Set<string> } = { '@aws-amplify/backend': new Set() };
  const refAuth = definition.referenceAuth;

  // The case where resources already exist and we want to import them
  // Converts refAuth object to TypeScript property assignments
  // Early return - skips all other blocks
  if (refAuth) {
    const referenceAuthProperties: Array<PropertyAssignment> = [];
    namedImports['@aws-amplify/backend'].add('referenceAuth');

    // Handle string propertiesx
    const stringProps: (keyof ReferenceAuth)[] = ['userPoolId', 'identityPoolId', 'authRoleArn', 'unauthRoleArn', 'userPoolClientId'];
    for (const prop of stringProps) {
      const value = refAuth[prop];
      if (value) {
        referenceAuthProperties.push(
          factory.createPropertyAssignment(factory.createIdentifier(prop), factory.createStringLiteral(value as string)),
        );
      }
    }

    // Handle groups object property
    if (refAuth.groups) {
      referenceAuthProperties.push(
        factory.createPropertyAssignment(
          factory.createIdentifier('groups'),
          factory.createObjectLiteralExpression(
            Object.entries(refAuth.groups).map(([key, value]) =>
              factory.createPropertyAssignment(factory.createStringLiteral(key), factory.createStringLiteral(value)),
            ),
            true,
          ),
        ),
      );
    }

    // Generates ts node array
    return renderResourceTsFile({
      exportedVariableName: factory.createIdentifier('auth'),
      functionCallParameter: factory.createObjectLiteralExpression(referenceAuthProperties, true),
      additionalImportedBackendIdentifiers: namedImports,
      backendFunctionConstruct: 'referenceAuth',
    });
  }

  // Setup phase for new auth resource creation
  // Initialize defineAuth configuration
  namedImports['@aws-amplify/backend'].add('defineAuth');
  const defineAuthProperties: Array<PropertyAssignment> = [];
  const secretErrors: ts.Node[] = []; // Collect secret-related error statements

  // Add secret import if external providers are configured
  const { loginOptions } = definition;
  if (
    loginOptions?.appleLogin ||
    loginOptions?.amazonLogin ||
    loginOptions?.googleLogin ||
    loginOptions?.facebookLogin ||
    (loginOptions?.oidcLogin && loginOptions.oidcLogin.length > 0) ||
    loginOptions?.samlLogin
  ) {
    namedImports['@aws-amplify/backend'].add('secret');
  }

  // Process login configuration (email, phone, social providers)
  const logInWithPropertyAssignment = createLogInWithPropertyAssignment(definition.loginOptions, secretErrors);
  defineAuthProperties.push(logInWithPropertyAssignment);

  // Add user attributes configuration if present
  // User attributes are basically data fields with each user (email, name, phone, or custom fields like department, id, etc)
  if (definition.customUserAttributes || definition.standardUserAttributes) {
    defineAuthProperties.push(createUserAttributeAssignments(definition.standardUserAttributes, definition.customUserAttributes));
  }

  // Add user groups configuration
  // Groups are a subset of user pools
  // Input: definition.groups = ['admin', 'user']
  // Output: groups: ['admin', 'user']
  if (definition.groups?.length) {
    defineAuthProperties.push(
      factory.createPropertyAssignment(
        factory.createIdentifier('groups'),
        factory.createArrayLiteralExpression(definition.groups.map((g) => factory.createStringLiteral(g))),
      ),
    );
  }

  // Check for Lambda triggers and external providers
  const hasFunctions = definition.lambdaTriggers && Object.keys(definition.lambdaTriggers).length > 0;

  // Process Lambda triggers if present
  if (hasFunctions) {
    assert(definition.lambdaTriggers);
    defineAuthProperties.push(createTriggersProperty(definition.lambdaTriggers));

    // Add imports for each Lambda function
    // The lambda code needs to follow the expected format: amplify/backend/function/functionName/...`
    for (const value of Object.values(definition.lambdaTriggers)) {
      const pathSegments = value.source.split('/');
      if (pathSegments.length < 4) {
        throw new Error(`Invalid Lambda source path format: ${value.source}. Expected format: amplify/backend/function/functionName/...`);
      }
      const functionName = pathSegments[3];
      if (!namedImports[`./${functionName}/resource`]) {
        namedImports[`./${functionName}/resource`] = new Set();
      }
      namedImports[`./${functionName}/resource`].add(functionName);
    }
  }

  // Add MFA configuration if present
  if (definition.mfa) {
    const multifactorProperties = [
      factory.createPropertyAssignment(factory.createIdentifier('mode'), factory.createStringLiteral(definition.mfa.mode)),
    ];

    // Add TOTP configuration
    if (definition.mfa.totp !== undefined) {
      multifactorProperties.push(
        factory.createPropertyAssignment(
          factory.createIdentifier('totp'),
          definition.mfa.totp ? factory.createTrue() : factory.createFalse(),
        ),
      );
    }

    // Add SMS configuration
    if (definition.mfa.sms !== undefined) {
      multifactorProperties.push(
        factory.createPropertyAssignment(
          factory.createIdentifier('sms'),
          definition.mfa.sms ? factory.createTrue() : factory.createFalse(),
        ),
      );
    }

    defineAuthProperties.push(
      factory.createPropertyAssignment(
        factory.createIdentifier('multifactor'),
        factory.createObjectLiteralExpression(multifactorProperties, true),
      ),
    );
  }

  // Add function access configuration if present
  if (functions && functions.length > 0) {
    // Extract functions with auth access from the functions array
    const functionsWithAuthAccess = functions.filter((func) => func.templateContent && func.resourceName);

    if (functionsWithAuthAccess.length > 0) {
      // Add function imports based on their category
      functionsWithAuthAccess.forEach((func) => {
        if (func.resourceName) {
          // Get the function category from the provided map, default to 'function'
          const functionCategory = functionCategories?.get(func.resourceName) || 'function';
          namedImports[`../${functionCategory}/${func.resourceName}/resource`] = new Set([func.resourceName]);
        }
      });

      const accessRules: ts.Expression[] = [];

      functionsWithAuthAccess.forEach((func) => {
        if (func.templateContent && func.resourceName) {
          const authAccess = parseAuthAccessFromTemplate(func.templateContent);

          Object.entries(authAccess)
            .filter(([, enabled]) => enabled)
            .forEach(([permission]) => {
              accessRules.push(
                factory.createCallExpression(
                  factory.createPropertyAccessExpression(
                    factory.createCallExpression(
                      factory.createPropertyAccessExpression(factory.createIdentifier('allow'), factory.createIdentifier('resource')),
                      undefined,
                      [factory.createIdentifier(func.resourceName!)],
                    ),
                    factory.createIdentifier('to'),
                  ),
                  undefined,
                  [factory.createArrayLiteralExpression([factory.createStringLiteral(permission)])],
                ),
              );
            });
        }
      });

      if (accessRules.length > 0) {
        defineAuthProperties.push(
          factory.createPropertyAssignment(
            factory.createIdentifier('access'),
            factory.createArrowFunction(
              undefined,
              undefined,
              [
                factory.createParameterDeclaration(undefined, undefined, factory.createIdentifier('allow')),
                factory.createParameterDeclaration(undefined, undefined, factory.createIdentifier('_unused')),
              ],
              undefined,
              undefined,
              factory.createArrayLiteralExpression(accessRules, true),
            ),
          ),
        );
      }
    }
  }

  // Generate the final TypeScript file with all configurations
  return renderResourceTsFile({
    exportedVariableName: factory.createIdentifier('auth'),
    functionCallParameter: factory.createObjectLiteralExpression(defineAuthProperties, true),
    additionalImportedBackendIdentifiers: namedImports,
    backendFunctionConstruct: 'defineAuth',
    // postImportStatements: secretErrors, // Include secret error handling
  });
}
