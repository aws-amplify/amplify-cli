import ts, { PropertyAssignment } from 'typescript';
import assert from 'node:assert';
import { PasswordPolicyType } from '@aws-sdk/client-cognito-identity-provider';
import { renderResourceTsFile } from '../resource/resource';
import { createTriggersProperty, Lambda } from '../function/lambda';

export type StandardAttribute = {
  readonly mutable?: boolean;
  readonly required?: boolean;
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

export type Group = string;

export type LoginOptions = {
  email?: boolean;
  emailOptions?: Partial<EmailOptions>;
  googleLogin?: boolean;
  amazonLogin?: boolean;
  appleLogin?: boolean;
  facebookLogin?: boolean;
  callbackURLs?: string[];
  logoutURLs?: string[];
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
  userAttributes?: StandardAttributes;
  userPoolOverrides?: UserPoolOverrides;
  lambdaTriggers?: Partial<AuthLambdaTriggers>;
}

const factory = ts.factory;

const secretIdentifier = factory.createIdentifier('secret');
const googleClientID = 'GOOGLE_CLIENT_ID';
const googleClientSecret = 'GOOGLE_CLIENT_SECRET';

const amazonClientID = 'LOGINWITHAMAZON_CLIENT_ID';
const amazonClientSecret = 'LOGINWITHAMAZON_CLIENT_SECRET';

const facebookClientID = 'FACEBOOK_CLIENT_ID';
const facebookClientSecret = 'FACEBOOK_CLIENT_SECRET';

const appleSiwaClientID = 'SIWA_CLIENT_ID';
const appleSiwaKeyId = 'SIWA_KEY_ID';
const appleSiwaPrivateKey = 'SIWA_PRIVATE_KEY';
const appleSiwaTeamID = 'SIWA_TEAM_ID';

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
  if (logInDefinition.googleLogin) {
    assignments.push(
      factory.createPropertyAssignment(
        factory.createIdentifier('externalProviders'),
        factory.createObjectLiteralExpression([
          factory.createPropertyAssignment(
            factory.createIdentifier('google'),
            factory.createObjectLiteralExpression([
              factory.createPropertyAssignment(
                factory.createIdentifier('clientId'),
                factory.createCallExpression(secretIdentifier, undefined, [factory.createStringLiteral(googleClientID)]),
              ),
              factory.createPropertyAssignment(
                factory.createIdentifier('clientSecret'),
                factory.createCallExpression(secretIdentifier, undefined, [factory.createStringLiteral(googleClientSecret)]),
              ),
            ]),
          ),
          factory.createPropertyAssignment(
            factory.createIdentifier('callbackUrls'),
            factory.createArrayLiteralExpression(logInDefinition.callbackURLs?.map((url) => factory.createStringLiteral(url))),
          ),
          factory.createPropertyAssignment(
            factory.createIdentifier('logoutUrls'),
            factory.createArrayLiteralExpression(logInDefinition.logoutURLs?.map((url) => factory.createStringLiteral(url))),
          ),
        ]),
      ),
    );
  } else if (logInDefinition.appleLogin) {
    assignments.push(
      factory.createPropertyAssignment(
        factory.createIdentifier('externalProviders'),
        factory.createObjectLiteralExpression([
          factory.createPropertyAssignment(
            factory.createIdentifier('signInWithApple'),
            factory.createObjectLiteralExpression([
              factory.createPropertyAssignment(
                factory.createIdentifier('clientId'),
                factory.createCallExpression(secretIdentifier, undefined, [factory.createStringLiteral(appleSiwaClientID)]),
              ),
              factory.createPropertyAssignment(
                factory.createIdentifier('keyId'),
                factory.createCallExpression(secretIdentifier, undefined, [factory.createStringLiteral(appleSiwaKeyId)]),
              ),
              factory.createPropertyAssignment(
                factory.createIdentifier('privateKey'),
                factory.createCallExpression(secretIdentifier, undefined, [factory.createStringLiteral(appleSiwaPrivateKey)]),
              ),
              factory.createPropertyAssignment(
                factory.createIdentifier('teamId'),
                factory.createCallExpression(secretIdentifier, undefined, [factory.createStringLiteral(appleSiwaTeamID)]),
              ),
            ]),
          ),
          factory.createPropertyAssignment(
            factory.createIdentifier('callbackUrls'),
            factory.createArrayLiteralExpression(logInDefinition.callbackURLs?.map((url) => factory.createStringLiteral(url))),
          ),
          factory.createPropertyAssignment(
            factory.createIdentifier('logoutUrls'),
            factory.createArrayLiteralExpression(logInDefinition.logoutURLs?.map((url) => factory.createStringLiteral(url))),
          ),
        ]),
      ),
    );
  } else if (logInDefinition.amazonLogin) {
    assignments.push(
      factory.createPropertyAssignment(
        factory.createIdentifier('externalProviders'),
        factory.createObjectLiteralExpression([
          factory.createPropertyAssignment(
            factory.createIdentifier('loginWithAmazon'),
            factory.createObjectLiteralExpression([
              factory.createPropertyAssignment(
                factory.createIdentifier('clientId'),
                factory.createCallExpression(secretIdentifier, undefined, [factory.createStringLiteral(amazonClientID)]),
              ),
              factory.createPropertyAssignment(
                factory.createIdentifier('clientSecret'),
                factory.createCallExpression(secretIdentifier, undefined, [factory.createStringLiteral(amazonClientSecret)]),
              ),
            ]),
          ),
          factory.createPropertyAssignment(
            factory.createIdentifier('callbackUrls'),
            factory.createArrayLiteralExpression(logInDefinition.callbackURLs?.map((url) => factory.createStringLiteral(url))),
          ),
          factory.createPropertyAssignment(
            factory.createIdentifier('logoutUrls'),
            factory.createArrayLiteralExpression(logInDefinition.logoutURLs?.map((url) => factory.createStringLiteral(url))),
          ),
        ]),
      ),
    );
  } else if (logInDefinition.facebookLogin) {
    assignments.push(
      factory.createPropertyAssignment(
        factory.createIdentifier('externalProviders'),
        factory.createObjectLiteralExpression([
          factory.createPropertyAssignment(
            factory.createIdentifier('facebook'),
            factory.createObjectLiteralExpression([
              factory.createPropertyAssignment(
                factory.createIdentifier('clientId'),
                factory.createCallExpression(secretIdentifier, undefined, [factory.createStringLiteral(facebookClientID)]),
              ),
              factory.createPropertyAssignment(
                factory.createIdentifier('clientSecret'),
                factory.createCallExpression(secretIdentifier, undefined, [factory.createStringLiteral(facebookClientSecret)]),
              ),
            ]),
          ),
          factory.createPropertyAssignment(
            factory.createIdentifier('callbackUrls'),
            factory.createArrayLiteralExpression(logInDefinition.callbackURLs?.map((url) => factory.createStringLiteral(url))),
          ),
          factory.createPropertyAssignment(
            factory.createIdentifier('logoutUrls'),
            factory.createArrayLiteralExpression(logInDefinition.logoutURLs?.map((url) => factory.createStringLiteral(url))),
          ),
        ]),
      ),
    );
  }
  return factory.createPropertyAssignment(logInWith, factory.createObjectLiteralExpression(assignments, true));
}

const createStandardAttributeDefinition = (attribute: StandardAttribute) => {
  const properties = Object.keys(attribute).map((key) =>
    factory.createPropertyAssignment(
      factory.createIdentifier(key),
      attribute[key as keyof StandardAttribute] ? factory.createTrue() : factory.createFalse(),
    ),
  );
  return factory.createObjectLiteralExpression(properties, true);
};

const createUserAttributeAssignments = (userAttributes: StandardAttributes) => {
  const userAttributeIdentifier = factory.createIdentifier('userAttributes');
  const userAttributeProperties = Object.entries((userAttributes as StandardAttributes) ?? {}).map(([key, value]) => {
    return factory.createPropertyAssignment(factory.createIdentifier(key), createStandardAttributeDefinition(value));
  });
  return factory.createPropertyAssignment(userAttributeIdentifier, factory.createObjectLiteralExpression(userAttributeProperties));
};

export function renderAuthNode(definition: AuthDefinition): ts.NodeArray<ts.Node> {
  const namedImports = [];
  const defineAuthProperties: Array<PropertyAssignment> = [];

  const logInWithPropertyAssignment = createLogInWithPropertyAssignment(definition.loginOptions);
  defineAuthProperties.push(logInWithPropertyAssignment);

  if (definition.userAttributes) {
    const userAttributePropertyAssignment = createUserAttributeAssignments(definition.userAttributes);
    defineAuthProperties.push(userAttributePropertyAssignment);
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
