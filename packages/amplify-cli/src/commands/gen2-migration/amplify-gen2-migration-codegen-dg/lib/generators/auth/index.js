'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.renderAuthNode = void 0;
const typescript_1 = __importDefault(require('typescript'));
const node_assert_1 = __importDefault(require('node:assert'));
const resource_1 = require('../../resource/resource');
const lambda_1 = require('../functions/lambda');
const factory = typescript_1.default.factory;
const secretIdentifier = factory.createIdentifier('secret');
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
function createProviderPropertyAssignment(name, config, attributeMapping) {
  return factory.createPropertyAssignment(
    factory.createIdentifier(name),
    factory.createObjectLiteralExpression(createProviderConfig(config, attributeMapping), true),
  );
}
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
    secretErrors === null || secretErrors === void 0
      ? void 0
      : secretErrors.push(...createSecretErrorStatements([googleClientID, googleClientSecret]));
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
    secretErrors === null || secretErrors === void 0
      ? void 0
      : secretErrors.push(...createSecretErrorStatements([appleClientID, appleKeyId, applePrivateKey, appleTeamID]));
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
    secretErrors === null || secretErrors === void 0
      ? void 0
      : secretErrors.push(...createSecretErrorStatements([amazonClientID, amazonClientSecret]));
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
    secretErrors === null || secretErrors === void 0
      ? void 0
      : secretErrors.push(...createSecretErrorStatements([facebookClientID, facebookClientSecret]));
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
    secretErrors === null || secretErrors === void 0
      ? void 0
      : secretErrors.push(...createSecretErrorStatements([oidcClientID, oidcClientSecret]));
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
      factory.createArrayLiteralExpression(
        callbackUrls === null || callbackUrls === void 0 ? void 0 : callbackUrls.map((url) => factory.createStringLiteral(url)),
      ),
    ),
    factory.createPropertyAssignment(
      factory.createIdentifier('logoutUrls'),
      factory.createArrayLiteralExpression(
        logoutUrls === null || logoutUrls === void 0 ? void 0 : logoutUrls.map((url) => factory.createStringLiteral(url)),
      ),
    ),
  ];
  return factory.createObjectLiteralExpression(properties, true);
}
function createLogInWithPropertyAssignment(logInDefinition = {}, secretErrors) {
  var _a, _b, _c, _d;
  const logInWith = factory.createIdentifier('loginWith');
  const assignments = [];
  if (logInDefinition.email === true && typeof logInDefinition.emailOptions === 'object') {
    const emailDefinitionAssignments = [];
    if ((_a = logInDefinition.emailOptions) === null || _a === void 0 ? void 0 : _a.emailVerificationSubject) {
      emailDefinitionAssignments.push(
        factory.createPropertyAssignment(
          'verificationEmailSubject',
          factory.createStringLiteral(logInDefinition.emailOptions.emailVerificationSubject),
        ),
      );
    }
    if ((_b = logInDefinition.emailOptions) === null || _b === void 0 ? void 0 : _b.emailVerificationBody) {
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
    const emailDefinitionAssignments = [];
    if ((_c = logInDefinition.emailOptions) === null || _c === void 0 ? void 0 : _c.emailVerificationSubject) {
      emailDefinitionAssignments.push(
        factory.createPropertyAssignment(
          'verificationEmailSubject',
          factory.createStringLiteral(logInDefinition.emailOptions.emailVerificationSubject),
        ),
      );
    }
    if ((_d = logInDefinition.emailOptions) === null || _d === void 0 ? void 0 : _d.emailVerificationBody) {
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
function createSecretErrorStatements(secretVariables) {
  return secretVariables.map((secret) =>
    factory.createCallExpression(factory.createIdentifier('throw new Error'), undefined, [
      factory.createStringLiteral(`Secrets need to be reset, use \`npx ampx sandbox secret set ${secret}\` to set the value`),
    ]),
  );
}
function renderAuthNode(definition) {
  var _a;
  const namedImports = { '@aws-amplify/backend': new Set() };
  const refAuth = definition.referenceAuth;
  if (refAuth) {
    const referenceAuthProperties = [];
    namedImports['@aws-amplify/backend'].add('referenceAuth');
    const stringProps = ['userPoolId', 'identityPoolId', 'authRoleArn', 'unauthRoleArn', 'userPoolClientId'];
    for (const prop of stringProps) {
      const value = refAuth[prop];
      if (value) {
        referenceAuthProperties.push(factory.createPropertyAssignment(factory.createIdentifier(prop), factory.createStringLiteral(value)));
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
    return (0, resource_1.renderResourceTsFile)({
      exportedVariableName: factory.createIdentifier('auth'),
      functionCallParameter: factory.createObjectLiteralExpression(referenceAuthProperties, true),
      additionalImportedBackendIdentifiers: namedImports,
      backendFunctionConstruct: 'referenceAuth',
    });
  }
  namedImports['@aws-amplify/backend'].add('defineAuth');
  const defineAuthProperties = [];
  const secretErrors = [];
  const { loginOptions } = definition;
  if (
    (loginOptions === null || loginOptions === void 0 ? void 0 : loginOptions.appleLogin) ||
    (loginOptions === null || loginOptions === void 0 ? void 0 : loginOptions.amazonLogin) ||
    (loginOptions === null || loginOptions === void 0 ? void 0 : loginOptions.googleLogin) ||
    (loginOptions === null || loginOptions === void 0 ? void 0 : loginOptions.facebookLogin) ||
    ((loginOptions === null || loginOptions === void 0 ? void 0 : loginOptions.oidcLogin) && loginOptions.oidcLogin.length > 0) ||
    (loginOptions === null || loginOptions === void 0 ? void 0 : loginOptions.samlLogin)
  ) {
    namedImports['@aws-amplify/backend'].add('secret');
  }
  const logInWithPropertyAssignment = createLogInWithPropertyAssignment(definition.loginOptions, secretErrors);
  defineAuthProperties.push(logInWithPropertyAssignment);
  if (definition.customUserAttributes || definition.standardUserAttributes) {
    defineAuthProperties.push(createUserAttributeAssignments(definition.standardUserAttributes, definition.customUserAttributes));
  }
  if ((_a = definition.groups) === null || _a === void 0 ? void 0 : _a.length) {
    defineAuthProperties.push(
      factory.createPropertyAssignment(
        factory.createIdentifier('groups'),
        factory.createArrayLiteralExpression(definition.groups.map((g) => factory.createStringLiteral(g))),
      ),
    );
  }
  const hasFunctions = definition.lambdaTriggers && Object.keys(definition.lambdaTriggers).length > 0;
  if (hasFunctions) {
    (0, node_assert_1.default)(definition.lambdaTriggers);
    defineAuthProperties.push((0, lambda_1.createTriggersProperty)(definition.lambdaTriggers));
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
  return (0, resource_1.renderResourceTsFile)({
    exportedVariableName: factory.createIdentifier('auth'),
    functionCallParameter: factory.createObjectLiteralExpression(defineAuthProperties, true),
    additionalImportedBackendIdentifiers: namedImports,
    backendFunctionConstruct: 'defineAuth',
    postImportStatements: secretErrors,
  });
}
exports.renderAuthNode = renderAuthNode;
//# sourceMappingURL=index.js.map
