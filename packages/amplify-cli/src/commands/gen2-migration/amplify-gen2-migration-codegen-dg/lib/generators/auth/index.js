'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.renderAuthNode = void 0;
// Auth generator - creates Gen 2 auth TypeScript files
// Logic from amplify-gen2-codegen auth module
const typescript_1 = __importDefault(require('typescript'));
const node_assert_1 = __importDefault(require('node:assert'));
const resource_1 = require('../../resource/resource');
const lambda_1 = require('../functions/lambda');
// TypeScript AST factory for creating nodes
const factory = typescript_1.default.factory;
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
function createProviderConfig(config, attributeMapping) {
  const properties = [];
  Object.entries(config).map(([key, value]) =>
    properties.push(
      factory.createPropertyAssignment(
        factory.createIdentifier(key),
        factory.createCallExpression(secretIdentifier, undefined, [factory.createStringLiteral(value)]),
      ),
    ),
  );
  if (attributeMapping) {
    const mappingProperties = [];
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
function createProviderPropertyAssignment(name, config, attributeMapping) {
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
function createOidcSamlPropertyAssignments(config) {
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
 * loginOptions = { googleLogin: true, facebookLogin: true }
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
 *   }
 * }
 * ```
 *
 * @param loginOptions - Login configuration with provider flags
 * @param callbackUrls - OAuth callback URLs
 * @param logoutUrls - OAuth logout URLs
 * @param secretErrors - Array to collect secret error statements
 * @returns TypeScript object literal expression for externalProviders
 */
function createExternalProvidersPropertyAssignment(loginOptions, callbackUrls, logoutUrls, secretErrors) {
  const providerAssignments = [];
  if (loginOptions.googleLogin) {
    providerAssignments.push(
      createProviderPropertyAssignment(
        'google',
        {
          clientId: googleClientID,
          clientSecret: googleClientSecret,
        },
        loginOptions.googleAttributes,
      ),
    );
    secretErrors?.push(...createSecretErrorStatements([googleClientID, googleClientSecret]));
  }
  if (loginOptions.appleLogin) {
    providerAssignments.push(
      createProviderPropertyAssignment(
        'signInWithApple',
        {
          clientId: appleClientID,
          keyId: appleKeyId,
          privateKey: applePrivateKey,
          teamId: appleTeamID,
        },
        loginOptions.appleAttributes,
      ),
    );
    secretErrors?.push(...createSecretErrorStatements([appleClientID, appleKeyId, applePrivateKey, appleTeamID]));
  }
  if (loginOptions.amazonLogin) {
    providerAssignments.push(
      createProviderPropertyAssignment(
        'loginWithAmazon',
        {
          clientId: amazonClientID,
          clientSecret: amazonClientSecret,
        },
        loginOptions.amazonAttributes,
      ),
    );
    secretErrors?.push(...createSecretErrorStatements([amazonClientID, amazonClientSecret]));
  }
  if (loginOptions.facebookLogin) {
    providerAssignments.push(
      createProviderPropertyAssignment(
        'facebook',
        {
          clientId: facebookClientID,
          clientSecret: facebookClientSecret,
        },
        loginOptions.facebookAttributes,
      ),
    );
    secretErrors?.push(...createSecretErrorStatements([facebookClientID, facebookClientSecret]));
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
    secretErrors?.push(...createSecretErrorStatements([oidcClientID, oidcClientSecret]));
  }
  if (loginOptions.scopes) {
    providerAssignments.push(
      factory.createPropertyAssignment(
        factory.createIdentifier('scopes'),
        factory.createArrayLiteralExpression(loginOptions.scopes.map((scope) => factory.createStringLiteral(scope))),
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
function createLogInWithPropertyAssignment(logInDefinition = {}, secretErrors) {
  const logInWith = factory.createIdentifier('loginWith');
  const assignments = [];
  if (logInDefinition.email === true && typeof logInDefinition.emailOptions === 'object') {
    // Handle both email: true AND emailOptions
    const emailDefinitionAssignments = [];
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
    const emailDefinitionAssignments = [];
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
const createStandardAttributeDefinition = (attribute) => {
  const properties = [];
  for (const key of Object.keys(attribute)) {
    const value = attribute[key];
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
const createUserAttributeAssignments = (standardAttributes, customAttributes) => {
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
      .filter((property) => property !== undefined);
    userAttributeProperties.push(...customAttributeProperties);
  }
  return factory.createPropertyAssignment(userAttributeIdentifier, factory.createObjectLiteralExpression(userAttributeProperties, true));
};
/**
 * Creates error statements for missing secrets
 *
 * Generates throw statements that provide helpful error messages
 * with CLI commands to set missing secrets.
 *
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
function createSecretErrorStatements(secretVariables) {
  return secretVariables.map((secret) =>
    factory.createCallExpression(factory.createIdentifier('throw new Error'), undefined, [
      factory.createStringLiteral(`Secrets need to be reset, use \`npx ampx sandbox secret set ${secret}\` to set the value`),
    ]),
  );
}
function renderAuthNode(definition) {
  // Track required imports from various packages
  //  Creates the data structure to track imports. Extracts reference auth config
  const namedImports = { '@aws-amplify/backend': new Set() };
  const refAuth = definition.referenceAuth;
  // The case where resources already exist and we want to import them
  // Converts refAuth object to TypeScript property assignments
  // Early return - skips all other blocks
  if (refAuth) {
    const referenceAuthProperties = [];
    namedImports['@aws-amplify/backend'].add('referenceAuth');
    // Handle string properties
    const stringProps = ['userPoolId', 'identityPoolId', 'authRoleArn', 'unauthRoleArn', 'userPoolClientId'];
    for (const prop of stringProps) {
      const value = refAuth[prop];
      if (value) {
        referenceAuthProperties.push(factory.createPropertyAssignment(factory.createIdentifier(prop), factory.createStringLiteral(value)));
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
    // Generates ts file
    return (0, resource_1.renderResourceTsFile)({
      exportedVariableName: factory.createIdentifier('auth'),
      functionCallParameter: factory.createObjectLiteralExpression(referenceAuthProperties, true),
      additionalImportedBackendIdentifiers: namedImports,
      backendFunctionConstruct: 'referenceAuth',
    });
  }
  // Setup phase for new auth resource creation
  // Initialize defineAuth configuration
  namedImports['@aws-amplify/backend'].add('defineAuth');
  const defineAuthProperties = [];
  const secretErrors = []; // Collect secret-related error statements
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
    (0, node_assert_1.default)(definition.lambdaTriggers);
    defineAuthProperties.push((0, lambda_1.createTriggersProperty)(definition.lambdaTriggers));
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
  // Generate the final TypeScript file with all configurations
  return (0, resource_1.renderResourceTsFile)({
    exportedVariableName: factory.createIdentifier('auth'),
    functionCallParameter: factory.createObjectLiteralExpression(defineAuthProperties, true),
    additionalImportedBackendIdentifiers: namedImports,
    backendFunctionConstruct: 'defineAuth',
    postImportStatements: secretErrors, // Include secret error handling
  });
}
exports.renderAuthNode = renderAuthNode;
//# sourceMappingURL=index.js.map
