// Auth generator - creates Gen 2 auth TypeScript files
// Duplicated from generate/generators/auth/index.ts for generate-new/ self-containment
import ts, { PropertyAssignment } from 'typescript';
import assert from 'node:assert';
import { PasswordPolicyType, UserPoolClientType } from '@aws-sdk/client-cognito-identity-provider';
import { renderResourceTsFile } from '../resource';
import { createTriggersProperty, Lambda } from './lambda';
import { FunctionDefinition } from './function-types';

/** OAuth 2.0 scopes supported by Cognito User Pools */
export type Scope = 'phone' | 'email' | 'openid' | 'profile' | 'aws.cognito.signin.user.admin';

/** Configuration for standard Cognito user attributes */
export type StandardAttribute = {
  readonly mutable?: boolean;
  readonly required?: boolean;
};

/** Configuration for custom user attributes with validation constraints */
export type CustomAttribute = {
  readonly dataType: string | undefined;
  readonly mutable?: boolean;
  minLen?: number;
  maxLen?: number;
  min?: number;
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
  emailVerificationBody: string;
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
  metadataContent: string;
  metadataType: 'URL' | 'FILE';
};

/** SAML identity provider configuration */
export type SamlOptions = {
  name?: string;
  metadata: MetadataOptions;
  attributeMapping?: AttributeMappingRule;
};

/** OpenID Connect endpoint URLs */
export type OidcEndPoints = {
  authorization?: string;
  token?: string;
  userInfo?: string;
  jwksUri?: string;
};

/** OpenID Connect identity provider configuration */
export type OidcOptions = {
  issuerUrl: string;
  name?: string;
  endpoints?: OidcEndPoints;
  attributeMapping?: AttributeMappingRule;
};

/** Comprehensive login configuration options */
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
  googleScopes?: string[];
  facebookScopes?: string[];
  amazonScopes?: string[];
  appleScopes?: string[];
  [key: string]: boolean | Partial<EmailOptions> | string[] | Scope[] | OidcOptions[] | SamlOptions | AttributeMappingRule | undefined;
};

/** Multi-factor authentication configuration */
export type MultifactorOptions = {
  mode: UserPoolMfaConfig;
  totp?: boolean;
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
  userPoolId?: string;
  identityPoolId?: string;
  authRoleArn?: string;
  unauthRoleArn?: string;
  userPoolClientId?: string;
  groups?: Record<string, string>;
};

/**
 * Complete authentication configuration definition.
 */
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

// TypeScript AST factory for creating nodes
const factory = ts.factory;

// Secret management identifier for Gen 2
const secretIdentifier = factory.createIdentifier('secret');

// Social provider secret key constants
const googleClientID = 'GOOGLE_CLIENT_ID';
const googleClientSecret = 'GOOGLE_CLIENT_SECRET';
const amazonClientID = 'LOGINWITHAMAZON_CLIENT_ID';
const amazonClientSecret = 'LOGINWITHAMAZON_CLIENT_SECRET';
const facebookClientID = 'FACEBOOK_CLIENT_ID';
const facebookClientSecret = 'FACEBOOK_CLIENT_SECRET';
const appleClientID = 'SIWA_CLIENT_ID';
const appleKeyId = 'SIWA_KEY_ID';
const applePrivateKey = 'SIWA_PRIVATE_KEY';
const appleTeamID = 'SIWA_TEAM_ID';
const oidcClientID = 'OIDC_CLIENT_ID';
const oidcClientSecret = 'OIDC_CLIENT_SECRET';

function createProviderConfig(config: Record<string, string>, attributeMapping: AttributeMappingRule | undefined) {
  const properties: ts.ObjectLiteralElementLike[] = [];

  Object.entries(config).map(([key, value]) => {
    if (key === 'scopes') {
      const scopeArray = value.split(' ').filter((scope) => scope.length > 0);
      properties.push(
        factory.createPropertyAssignment(
          factory.createIdentifier('scopes'),
          factory.createArrayLiteralExpression(scopeArray.map((scope) => factory.createStringLiteral(scope))),
        ),
      );
    } else {
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
    if (loginOptions.googleScopes && loginOptions.googleScopes.length > 0) {
      googleConfig.scopes = loginOptions.googleScopes.join(' ');
    }
    providerAssignments.push(createProviderPropertyAssignment('google', googleConfig, loginOptions.googleAttributes));
  }

  if (loginOptions.appleLogin) {
    const appleConfig: Record<string, string> = {
      clientId: appleClientID,
      keyId: appleKeyId,
      privateKey: applePrivateKey,
      teamId: appleTeamID,
    };
    if (loginOptions.appleScopes && loginOptions.appleScopes.length > 0) {
      appleConfig.scopes = loginOptions.appleScopes.join(' ');
    }
    providerAssignments.push(createProviderPropertyAssignment('signInWithApple', appleConfig, loginOptions.appleAttributes));
  }

  if (loginOptions.amazonLogin) {
    const amazonConfig: Record<string, string> = {
      clientId: amazonClientID,
      clientSecret: amazonClientSecret,
    };
    if (loginOptions.amazonScopes && loginOptions.amazonScopes.length > 0) {
      amazonConfig.scopes = loginOptions.amazonScopes.join(' ');
    }
    providerAssignments.push(createProviderPropertyAssignment('loginWithAmazon', amazonConfig, loginOptions.amazonAttributes));
  }

  if (loginOptions.facebookLogin) {
    const facebookConfig: Record<string, string> = {
      clientId: facebookClientID,
      clientSecret: facebookClientSecret,
    };
    if (loginOptions.facebookScopes && loginOptions.facebookScopes.length > 0) {
      facebookConfig.scopes = loginOptions.facebookScopes.join(' ');
    }
    providerAssignments.push(createProviderPropertyAssignment('facebook', facebookConfig, loginOptions.facebookAttributes));
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
  }

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

function createLogInWithPropertyAssignment(logInDefinition: LoginOptions = {}, secretErrors: ts.Node[]) {
  const logInWith = factory.createIdentifier('loginWith');
  const assignments: ts.ObjectLiteralElementLike[] = [];
  if (logInDefinition.email === true && typeof logInDefinition.emailOptions === 'object') {
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
  } else if (typeof logInDefinition.emailOptions === 'object') {
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
  const namedImports: { [importedPackageName: string]: Set<string> } = { '@aws-amplify/backend': new Set() };
  const refAuth = definition.referenceAuth;

  // Reference auth early return
  if (refAuth) {
    const referenceAuthProperties: Array<PropertyAssignment> = [];
    namedImports['@aws-amplify/backend'].add('referenceAuth');

    const stringProps: (keyof ReferenceAuth)[] = ['userPoolId', 'identityPoolId', 'authRoleArn', 'unauthRoleArn', 'userPoolClientId'];
    for (const prop of stringProps) {
      const value = refAuth[prop];
      if (value) {
        referenceAuthProperties.push(
          factory.createPropertyAssignment(factory.createIdentifier(prop), factory.createStringLiteral(value as string)),
        );
      }
    }

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

    return renderResourceTsFile({
      exportedVariableName: factory.createIdentifier('auth'),
      functionCallParameter: factory.createObjectLiteralExpression(referenceAuthProperties, true),
      additionalImportedBackendIdentifiers: namedImports,
      backendFunctionConstruct: 'referenceAuth',
    });
  }

  // Standard auth
  namedImports['@aws-amplify/backend'].add('defineAuth');
  const defineAuthProperties: Array<PropertyAssignment> = [];
  const secretErrors: ts.Node[] = [];

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

  const logInWithPropertyAssignment = createLogInWithPropertyAssignment(definition.loginOptions, secretErrors);
  defineAuthProperties.push(logInWithPropertyAssignment);

  if (definition.customUserAttributes || definition.standardUserAttributes) {
    defineAuthProperties.push(createUserAttributeAssignments(definition.standardUserAttributes, definition.customUserAttributes));
  }

  if (definition.groups?.length) {
    defineAuthProperties.push(
      factory.createPropertyAssignment(
        factory.createIdentifier('groups'),
        factory.createArrayLiteralExpression(definition.groups.map((g) => factory.createStringLiteral(g))),
      ),
    );
  }

  const hasFunctions = definition.lambdaTriggers && Object.keys(definition.lambdaTriggers).length > 0;

  if (hasFunctions) {
    assert(definition.lambdaTriggers);
    defineAuthProperties.push(createTriggersProperty(definition.lambdaTriggers));

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

    if (definition.mfa.totp !== undefined) {
      multifactorProperties.push(
        factory.createPropertyAssignment(
          factory.createIdentifier('totp'),
          definition.mfa.totp ? factory.createTrue() : factory.createFalse(),
        ),
      );
    }

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
    const functionsWithAuthAccess = functions.filter((func) => func.authAccess && Object.keys(func.authAccess).length > 0);

    if (functionsWithAuthAccess.length > 0) {
      functionsWithAuthAccess.forEach((func) => {
        if (func.resourceName) {
          const functionCategory = functionCategories?.get(func.resourceName) || 'function';
          namedImports[`../${functionCategory}/${func.resourceName}/resource`] = new Set([func.resourceName]);
        }
      });

      const accessRules: ts.Expression[] = [];

      functionsWithAuthAccess.forEach((func) => {
        if (func.authAccess && func.resourceName) {
          Object.entries(func.authAccess)
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

  return renderResourceTsFile({
    exportedVariableName: factory.createIdentifier('auth'),
    functionCallParameter: factory.createObjectLiteralExpression(defineAuthProperties, true),
    additionalImportedBackendIdentifiers: namedImports,
    backendFunctionConstruct: 'defineAuth',
  });
}
