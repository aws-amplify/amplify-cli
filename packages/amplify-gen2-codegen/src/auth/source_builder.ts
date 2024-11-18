import ts, { PropertyAssignment } from 'typescript';
import assert from 'node:assert';
import { PasswordPolicyType, UserPoolClientType } from '@aws-sdk/client-cognito-identity-provider';
import { renderResourceTsFile } from '../resource/resource';
import { createTriggersProperty, Lambda } from '../function/lambda';

export type Scope = 'PHONE' | 'EMAIL' | 'OPENID' | 'PROFILE' | 'COGNITO_ADMIN';

export type StandardAttribute = {
  readonly mutable?: boolean;
  readonly required?: boolean;
};

export type CustomAttribute = {
  readonly dataType: string | undefined;
  readonly mutable?: boolean;

  // StringAttributeConstraints
  minLen?: number;
  maxLen?: number;

  // NumberAttributeConstraints
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

const factory = ts.factory;

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

function createProviderConfig(config: Record<string, string>, attributeMapping: AttributeMappingRule | undefined) {
  const properties: ts.ObjectLiteralElementLike[] = [];

  Object.entries(config).map(([key, value]) =>
    properties.push(
      factory.createPropertyAssignment(
        factory.createIdentifier(key),
        factory.createCallExpression(secretIdentifier, undefined, [factory.createStringLiteral(value)]),
      ),
    ),
  );

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

function createSecretErrorStatements(secretVariables: string[]): ts.Node[] {
  return secretVariables.map((secret) =>
    factory.createCallExpression(factory.createIdentifier('throw new Error'), undefined, [
      factory.createStringLiteral(`Secrets need to be reset, use \`npx ampx sandbox secret set ${secret}\` to set the value`),
    ]),
  );
}

function createExternalProvidersPropertyAssignment(
  loginOptions: LoginOptions,
  callbackUrls?: string[],
  logoutUrls?: string[],
  secretErrors?: ts.Node[],
) {
  const providerAssignments: PropertyAssignment[] = [];

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

function createLogInWithPropertyAssignment(logInDefinition: LoginOptions = {}, secretErrors: ts.Node[]) {
  const logInWith = factory.createIdentifier('loginWith');
  const assignments: ts.ObjectLiteralElementLike[] = [];
  if (logInDefinition.email === true) {
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

export function renderAuthNode(definition: AuthDefinition): ts.NodeArray<ts.Node> {
  const namedImports: { [importedPackageName: string]: Set<string> } = { '@aws-amplify/backend': new Set() };
  const refAuth = definition.referenceAuth;
  if (refAuth) {
    const referenceAuthProperties: Array<PropertyAssignment> = [];
    namedImports['@aws-amplify/backend'].add('referenceAuth');
    for (const [key, value] of Object.entries(refAuth)) {
      if (value) {
        referenceAuthProperties.push(
          factory.createPropertyAssignment(
            factory.createIdentifier(key),
            typeof value === 'object'
              ? factory.createObjectLiteralExpression(
                  Object.entries(value).map(([_key, _value]) =>
                    factory.createPropertyAssignment(factory.createIdentifier(_key), factory.createStringLiteral(_value)),
                  ),
                  true,
                )
              : factory.createStringLiteral(value),
          ),
        );
      }
    }
    return renderResourceTsFile({
      exportedVariableName: factory.createIdentifier('auth'),
      functionCallParameter: factory.createObjectLiteralExpression(referenceAuthProperties, true),
      additionalImportedBackendIdentifiers: namedImports,
      backendFunctionConstruct: 'referenceAuth',
    });
  }

  namedImports['@aws-amplify/backend'].add('defineAuth');
  const defineAuthProperties: Array<PropertyAssignment> = [];
  const secretErrors: ts.Node[] = [];

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
  if (hasFunctions) {
    assert(definition.lambdaTriggers);
    defineAuthProperties.push(createTriggersProperty(definition.lambdaTriggers));
    for (const value of Object.values(definition.lambdaTriggers)) {
      const functionName = value.source.split('/')[3];
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

  return renderResourceTsFile({
    exportedVariableName: factory.createIdentifier('auth'),
    functionCallParameter: factory.createObjectLiteralExpression(defineAuthProperties, true),
    additionalImportedBackendIdentifiers: namedImports,
    backendFunctionConstruct: 'defineAuth',
    postImportStatements: secretErrors,
  });
}
