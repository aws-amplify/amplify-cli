import ts, { PropertyAssignment, SyntaxKind } from 'typescript';
import assert from 'node:assert';
import { PasswordPolicyType } from '@aws-sdk/client-cognito-identity-provider';
import { renderResourceTsFile } from '../resource/resource';
import { Lambda } from '../function/lambda';

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
};

export type MultifactorOptions = {
  mode: UserPoolMfaConfig;
  totp?: boolean;
};

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

export type AuthLambdaTriggers = Record<AuthTriggerEvents, Lambda>;

export interface AuthDefinition {
  loginOptions?: LoginOptions;
  lambdaTriggers?: Partial<AuthLambdaTriggers>;
  groups?: Group[];
  mfa?: MultifactorOptions;
  userAttributes?: StandardAttributes;
  userPoolOverrides?: UserPoolOverrides;
}

const factory = ts.factory;

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
  return factory.createPropertyAssignment(userAttributeIdentifier, factory.createObjectLiteralExpression(userAttributeProperties, true));
};

export function renderAuthNode(definition: AuthDefinition): ts.NodeArray<ts.Node> {
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
  if (hasFunctions) {
    assert(definition.lambdaTriggers);
    defineAuthProperties.push(
      factory.createPropertyAssignment(
        factory.createIdentifier('triggers'),
        factory.createObjectLiteralExpression(
          Object.entries(definition.lambdaTriggers).map(([key, { source }]) => {
            return ts.addSyntheticLeadingComment(
              factory.createPropertyAssignment(
                key,
                factory.createCallExpression(factory.createIdentifier('defineFunction'), undefined, [
                  factory.createObjectLiteralExpression([]),
                ]),
              ),
              SyntaxKind.MultiLineCommentTrivia,
              `\nSource code for this function can be found in your Amplify Gen 1 Directory.\nSee ${source}\n`,
              true,
            );
          }),
          true,
        ),
      ),
    );
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
    additionalImportedBackendIdentifiers: hasFunctions ? ['defineFunction'] : [],
    backendFunctionConstruct: 'defineAuth',
    importedPackageName: '@aws-amplify/backend',
  });
}
