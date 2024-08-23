import ts, { PropertyAssignment } from 'typescript';
import assert from 'node:assert';
import { PasswordPolicyType } from '@aws-sdk/client-cognito-identity-provider';
import { renderResourceTsFile } from '../resource/resource';
import { createTriggersProperty, Lambda } from '../function/lambda';

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

export type SendingAccount = 'COGNITO_DEFAULT' | 'DEVELOPER';

export type UserPoolMfaConfig = 'OFF' | 'ON' | 'OPTIONAL';

export type PasswordPolicyPath = `Policies.PasswordPolicy.${keyof PasswordPolicyType}`;

export type UserPoolOverrides = Partial<Record<PasswordPolicyPath, string | number | boolean>>;

export type EmailOptions = {
  emailVerificationBody: string;
  emailVerificationSubject: string;
};

export type StandardAttributes = Partial<Record<Attribute, StandardAttribute>>;
export type CustomAttributes = Partial<Record<`custom:${string}`, CustomAttribute>>;

export type Group = string;

export type LoginOptions = {
  email?: boolean;
  phone?: boolean;
  emailOptions?: Partial<EmailOptions>;
  googleLogin?: boolean;
  amazonLogin?: boolean;
  appleLogin?: boolean;
  facebookLogin?: boolean;
  callbackURLs?: string[];
  logoutURLs?: string[];
  [key: string]: boolean | Partial<EmailOptions> | string[] | undefined;
};

export type MultifactorOptions = {
  mode: UserPoolMfaConfig;
  totp?: boolean;
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

export interface AuthDefinition {
  loginOptions?: LoginOptions;
  groups?: Group[];
  mfa?: MultifactorOptions;
  standardUserAttributes?: StandardAttributes;
  customUserAttributes?: CustomAttributes;
  userPoolOverrides?: UserPoolOverrides;
  lambdaTriggers?: Partial<AuthLambdaTriggers>;
  guestLogin?: boolean;
  oAuthFlows?: string[];
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

function createProviderConfig(config: Record<string, string>) {
  return Object.entries(config).map(([key, value]) =>
    factory.createPropertyAssignment(
      factory.createIdentifier(key),
      factory.createCallExpression(secretIdentifier, undefined, [factory.createStringLiteral(value)]),
    ),
  );
}

function createProviderPropertyAssignment(name: string, config: Record<string, string>) {
  return factory.createPropertyAssignment(
    factory.createIdentifier(name),
    factory.createObjectLiteralExpression(createProviderConfig(config), true),
  );
}

function createExternalProvidersPropertyAssignment(loginOptions: LoginOptions, callbackUrls?: string[], logoutUrls?: string[]) {
  const providerAssignments: PropertyAssignment[] = [];

  if (loginOptions.googleLogin) {
    providerAssignments.push(
      createProviderPropertyAssignment('google', {
        clientId: googleClientID,
        clientSecret: googleClientSecret,
      }),
    );
  }

  if (loginOptions.appleLogin) {
    providerAssignments.push(
      createProviderPropertyAssignment('signInWithApple', {
        clientId: appleClientID,
        keyId: appleKeyId,
        privateKey: applePrivateKey,
        teamId: appleTeamID,
      }),
    );
  }

  if (loginOptions.amazonLogin) {
    providerAssignments.push(
      createProviderPropertyAssignment('loginWithAmazon', {
        clientId: amazonClientID,
        clientSecret: amazonClientSecret,
      }),
    );
  }

  if (loginOptions.facebookLogin) {
    providerAssignments.push(
      createProviderPropertyAssignment('facebook', {
        clientId: facebookClientID,
        clientSecret: facebookClientSecret,
      }),
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

function createLogInWithPropertyAssignment(logInDefinition: LoginOptions = {}) {
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
  if (logInDefinition.amazonLogin || logInDefinition.googleLogin || logInDefinition.facebookLogin || logInDefinition.appleLogin) {
    assignments.push(
      factory.createPropertyAssignment(
        factory.createIdentifier('externalProviders'),
        createExternalProvidersPropertyAssignment(logInDefinition, logInDefinition.callbackURLs, logInDefinition.logoutURLs),
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
  const namedImports = [];
  const defineAuthProperties: Array<PropertyAssignment> = [];

  const logInWithPropertyAssignment = createLogInWithPropertyAssignment(definition.loginOptions);
  defineAuthProperties.push(logInWithPropertyAssignment);

  const userAttributePropertyAssignment = createUserAttributeAssignments(
    definition.standardUserAttributes,
    definition.customUserAttributes,
  );
  defineAuthProperties.push(userAttributePropertyAssignment);

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
  if (loginOptions?.appleLogin || loginOptions?.amazonLogin || loginOptions?.googleLogin || loginOptions?.facebookLogin) {
    namedImports.push('secret');
  }
  if (hasFunctions) {
    assert(definition.lambdaTriggers);
    defineAuthProperties.push(createTriggersProperty(definition.lambdaTriggers));
    namedImports.push('defineFunction');
  }

  if (definition.mfa) {
    defineAuthProperties.push(
      factory.createPropertyAssignment(
        factory.createIdentifier('multifactor'),
        factory.createObjectLiteralExpression(
          [
            factory.createPropertyAssignment(factory.createIdentifier('mode'), factory.createStringLiteral(definition.mfa.mode)),
            factory.createPropertyAssignment(
              factory.createIdentifier('totp'),
              definition.mfa.totp ? factory.createTrue() : factory.createFalse(),
            ),
          ],
          true,
        ),
      ),
    );
  }

  return renderResourceTsFile({
    exportedVariableName: factory.createIdentifier('auth'),
    functionCallParameter: factory.createObjectLiteralExpression(defineAuthProperties, true),
    additionalImportedBackendIdentifiers: namedImports,
    backendFunctionConstruct: 'defineAuth',
    importedPackageName: '@aws-amplify/backend',
  });
}
