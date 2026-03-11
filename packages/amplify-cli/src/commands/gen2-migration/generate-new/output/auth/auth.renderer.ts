import ts, { PropertyAssignment } from 'typescript';
import { PasswordPolicyType, UserPoolClientType } from '@aws-sdk/client-cognito-identity-provider';
import { renderResourceTsFile } from '../../resource';

/**
 * Represents a Lambda function trigger source.
 */
export type Lambda = {
  readonly source: string;
};

/**
 * Creates a TypeScript AST property assignment for auth Lambda triggers.
 */
function createTriggersProperty(triggers: Record<string, Lambda>): PropertyAssignment {
  return factory.createPropertyAssignment(
    factory.createIdentifier('triggers'),
    factory.createObjectLiteralExpression(
      Object.entries(triggers).map(([key, value]) => {
        const functionName = value.source.split('/')[3];
        return factory.createPropertyAssignment(factory.createIdentifier(key), factory.createIdentifier(functionName));
      }),
      true,
    ),
  );
}

/**
 * OAuth 2.0 scopes supported by Cognito User Pools
 */
export type Scope = 'phone' | 'email' | 'openid' | 'profile' | 'aws.cognito.signin.user.admin';

/**
 * Configuration for standard Cognito user attributes
 */
export type StandardAttribute = {
  readonly mutable?: boolean;
  readonly required?: boolean;
};

/**
 * Configuration for custom user attributes with validation constraints.
 */
export type CustomAttribute = {
  readonly dataType: string | undefined;
  readonly mutable?: boolean;
  readonly minLen?: number;
  readonly maxLen?: number;
  readonly min?: number;
  readonly max?: number;
};

/**
 * Standard user attributes supported by Cognito User Pools
 */
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

/**
 * Maps standard attributes to external provider attribute names
 */
export type AttributeMappingRule = Record<Attribute, string>;

/**
 * Email sending account configuration for Cognito
 */
export type SendingAccount = 'COGNITO_DEFAULT' | 'DEVELOPER';

/**
 * Multi-factor authentication configuration modes
 */
export type UserPoolMfaConfig = 'OFF' | 'REQUIRED' | 'OPTIONAL';

/**
 * Type-safe paths for password policy overrides
 */
export type PasswordPolicyPath = `Policies.PasswordPolicy.${keyof PasswordPolicyType}`;

/**
 * CloudFormation policy overrides for User Pool configuration
 */
export type PolicyOverrides = Partial<Record<PasswordPolicyPath | string, string | boolean | number | string[]>>;

/**
 * Email verification message customization
 */
export type EmailOptions = {
  readonly emailVerificationBody: string;
  readonly emailVerificationSubject: string;
};

/**
 * Collection of standard user attributes with their configurations
 */
export type StandardAttributes = Partial<Record<Attribute, StandardAttribute>>;
/**
 * Collection of custom user attributes with their configurations
 */
export type CustomAttributes = Partial<Record<`custom:${string}`, CustomAttribute>>;

/**
 * User group name
 */
export type Group = string;

/**
 * SAML metadata configuration options
 */
export type MetadataOptions = {
  readonly metadataContent: string;
  readonly metadataType: 'URL' | 'FILE';
};

/**
 * SAML identity provider configuration.
 */
export type SamlOptions = {
  readonly name?: string;
  readonly metadata: MetadataOptions;
  readonly attributeMapping?: AttributeMappingRule;
};

/**
 * OpenID Connect endpoint URLs
 */
export type OidcEndPoints = {
  readonly authorization?: string;
  readonly token?: string;
  readonly userInfo?: string;
  readonly jwksUri?: string;
};

/**
 * OpenID Connect identity provider configuration.
 */
export type OidcOptions = {
  readonly issuerUrl: string;
  readonly name?: string;
  readonly endpoints?: OidcEndPoints;
  readonly attributeMapping?: AttributeMappingRule;
};

/**
 * Comprehensive login configuration options.
 */
export type LoginOptions = {
  readonly email?: boolean;
  readonly phone?: boolean;
  readonly emailOptions?: Partial<EmailOptions>;
  readonly googleLogin?: boolean;
  readonly amazonLogin?: boolean;
  readonly appleLogin?: boolean;
  readonly facebookLogin?: boolean;
  readonly oidcLogin?: readonly OidcOptions[];
  readonly samlLogin?: SamlOptions;
  readonly googleAttributes?: AttributeMappingRule;
  readonly amazonAttributes?: AttributeMappingRule;
  readonly appleAttributes?: AttributeMappingRule;
  readonly facebookAttributes?: AttributeMappingRule;
  readonly callbackURLs?: readonly string[];
  readonly logoutURLs?: readonly string[];
  readonly scopes?: readonly Scope[];
  readonly googleScopes?: readonly string[];
  readonly facebookScopes?: readonly string[];
  readonly amazonScopes?: readonly string[];
  readonly appleScopes?: readonly string[];
};

/**
 * Multi-factor authentication configuration.
 */
export type MultifactorOptions = {
  readonly mode: UserPoolMfaConfig;
  readonly totp?: boolean;
  readonly sms?: boolean;
};

/**
 * Lambda triggers for Cognito User Pool events
 */
export type AuthLambdaTriggers = Record<AuthTriggerEvents, Lambda>;

/**
 * Cognito User Pool Lambda trigger event types
 */
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

/**
 * Configuration for referencing existing auth resources
 */
export type ReferenceAuth = {
  readonly userPoolId?: string;
  readonly identityPoolId?: string;
  readonly authRoleArn?: string;
  readonly unauthRoleArn?: string;
  readonly userPoolClientId?: string;
  readonly groups?: Record<string, string>;
};

/**
 * Auth access permissions for a Lambda function.
 */
export interface AuthAccess {
  readonly manageUsers?: boolean;
  readonly manageGroups?: boolean;
  readonly manageGroupMembership?: boolean;
  readonly manageUserDevices?: boolean;
  readonly managePasswordRecovery?: boolean;
  readonly addUserToGroup?: boolean;
  readonly createUser?: boolean;
  readonly deleteUser?: boolean;
  readonly deleteUserAttributes?: boolean;
  readonly disableUser?: boolean;
  readonly enableUser?: boolean;
  readonly forgetDevice?: boolean;
  readonly getDevice?: boolean;
  readonly getUser?: boolean;
  readonly listUsers?: boolean;
  readonly listDevices?: boolean;
  readonly listGroupsForUser?: boolean;
  readonly listUsersInGroup?: boolean;
  readonly listGroups?: boolean;
  readonly removeUserFromGroup?: boolean;
  readonly resetUserPassword?: boolean;
  readonly setUserMfaPreference?: boolean;
  readonly setUserPassword?: boolean;
  readonly setUserSettings?: boolean;
  readonly updateDeviceStatus?: boolean;
  readonly updateUserAttributes?: boolean;
}

/**
 * Minimal function info needed by the auth renderer to emit access rules.
 */
export interface FunctionAuthInfo {
  /**
   * The Amplify resource name.
   */
  readonly resourceName: string;

  /**
   * Auth access permissions for this function.
   */
  readonly authAccess: AuthAccess;
}

/**
 * Complete authentication configuration definition.
 */
export interface AuthDefinition {
  readonly loginOptions?: LoginOptions;
  readonly groups?: readonly Group[];
  readonly mfa?: MultifactorOptions;
  readonly standardUserAttributes?: StandardAttributes;
  readonly customUserAttributes?: CustomAttributes;
  readonly userPoolOverrides?: PolicyOverrides;
  readonly lambdaTriggers?: Partial<AuthLambdaTriggers>;
  readonly guestLogin?: boolean;
  readonly identityPoolName?: string;
  readonly oAuthFlows?: readonly string[];
  readonly readAttributes?: readonly string[];
  readonly writeAttributes?: readonly string[];
  readonly referenceAuth?: ReferenceAuth;
  readonly userPoolClient?: UserPoolClientType;
  readonly functions?: readonly FunctionAuthInfo[];
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

/**
 * Renders a defineAuth() resource.ts file from Gen1 Cognito configuration.
 * Pure — no AWS calls, no side effects.
 */
export class AuthRenderer {
  /**
   * Produces the complete TypeScript AST for auth/resource.ts.
   */
  public render(definition: AuthDefinition): ts.NodeArray<ts.Node> {
    const namedImports: { [importedPackageName: string]: Set<string> } = { '@aws-amplify/backend': new Set() };
    const refAuth = definition.referenceAuth;

    if (refAuth) {
      return this.renderReferenceAuth(refAuth, namedImports);
    }

    return this.renderStandardAuth(definition, namedImports);
  }

  private renderReferenceAuth(refAuth: ReferenceAuth, namedImports: Record<string, Set<string>>): ts.NodeArray<ts.Node> {
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

  private renderStandardAuth(definition: AuthDefinition, namedImports: Record<string, Set<string>>): ts.NodeArray<ts.Node> {
    namedImports['@aws-amplify/backend'].add('defineAuth');
    const defineAuthProperties: Array<PropertyAssignment> = [];

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

    defineAuthProperties.push(this.createLogInWithPropertyAssignment(definition.loginOptions));

    if (definition.customUserAttributes || definition.standardUserAttributes) {
      defineAuthProperties.push(this.createUserAttributeAssignments(definition.standardUserAttributes, definition.customUserAttributes));
    }

    if (definition.groups?.length) {
      defineAuthProperties.push(
        factory.createPropertyAssignment(
          factory.createIdentifier('groups'),
          factory.createArrayLiteralExpression(definition.groups.map((g) => factory.createStringLiteral(g))),
        ),
      );
    }

    this.addLambdaTriggers(definition, defineAuthProperties, namedImports);
    this.addMfaConfig(definition, defineAuthProperties);
    this.addFunctionAccess(definition.functions, defineAuthProperties, namedImports);

    return renderResourceTsFile({
      exportedVariableName: factory.createIdentifier('auth'),
      functionCallParameter: factory.createObjectLiteralExpression(defineAuthProperties, true),
      additionalImportedBackendIdentifiers: namedImports,
      backendFunctionConstruct: 'defineAuth',
    });
  }

  private addLambdaTriggers(definition: AuthDefinition, properties: PropertyAssignment[], namedImports: Record<string, Set<string>>): void {
    if (!definition.lambdaTriggers || Object.keys(definition.lambdaTriggers).length === 0) {
      return;
    }

    properties.push(createTriggersProperty(definition.lambdaTriggers));

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

  private addMfaConfig(definition: AuthDefinition, properties: PropertyAssignment[]): void {
    if (!definition.mfa) {
      return;
    }

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

    properties.push(
      factory.createPropertyAssignment(
        factory.createIdentifier('multifactor'),
        factory.createObjectLiteralExpression(multifactorProperties, true),
      ),
    );
  }

  private addFunctionAccess(
    functions: readonly FunctionAuthInfo[] | undefined,
    properties: PropertyAssignment[],
    namedImports: Record<string, Set<string>>,
  ): void {
    if (!functions || functions.length === 0) {
      return;
    }

    const functionsWithAuthAccess = functions.filter((func) => Object.keys(func.authAccess).length > 0);
    if (functionsWithAuthAccess.length === 0) {
      return;
    }

    for (const func of functionsWithAuthAccess) {
      namedImports[`../function/${func.resourceName}/resource`] = new Set([func.resourceName]);
    }

    const accessRules: ts.Expression[] = [];

    for (const func of functionsWithAuthAccess) {
      for (const [permission, enabled] of Object.entries(func.authAccess)) {
        if (enabled) {
          accessRules.push(
            factory.createCallExpression(
              factory.createPropertyAccessExpression(
                factory.createCallExpression(
                  factory.createPropertyAccessExpression(factory.createIdentifier('allow'), factory.createIdentifier('resource')),
                  undefined,
                  [factory.createIdentifier(func.resourceName)],
                ),
                factory.createIdentifier('to'),
              ),
              undefined,
              [factory.createArrayLiteralExpression([factory.createStringLiteral(permission)])],
            ),
          );
        }
      }
    }

    if (accessRules.length > 0) {
      properties.push(
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

  private createLogInWithPropertyAssignment(logInDefinition: LoginOptions = {}): PropertyAssignment {
    const logInWith = factory.createIdentifier('loginWith');
    const assignments: ts.ObjectLiteralElementLike[] = [];

    if (logInDefinition.email === true && typeof logInDefinition.emailOptions === 'object') {
      assignments.push(
        factory.createPropertyAssignment(factory.createIdentifier('email'), this.createEmailDefinitionObject(logInDefinition.emailOptions)),
      );
    } else if (logInDefinition.email === true) {
      assignments.push(factory.createPropertyAssignment(factory.createIdentifier('email'), factory.createTrue()));
    } else if (typeof logInDefinition.emailOptions === 'object') {
      assignments.push(
        factory.createPropertyAssignment(factory.createIdentifier('email'), this.createEmailDefinitionObject(logInDefinition.emailOptions)),
      );
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
          this.createExternalProvidersExpression(logInDefinition, logInDefinition.callbackURLs, logInDefinition.logoutURLs),
        ),
      );
    }

    return factory.createPropertyAssignment(logInWith, factory.createObjectLiteralExpression(assignments, true));
  }

  private createEmailDefinitionObject(emailOptions: Partial<EmailOptions> | undefined): ts.ObjectLiteralExpression {
    const emailDefinitionAssignments: ts.ObjectLiteralElementLike[] = [];

    if (emailOptions?.emailVerificationSubject) {
      emailDefinitionAssignments.push(
        factory.createPropertyAssignment('verificationEmailSubject', factory.createStringLiteral(emailOptions.emailVerificationSubject)),
      );
    }
    if (emailOptions?.emailVerificationBody) {
      emailDefinitionAssignments.push(
        factory.createPropertyAssignment(
          'verificationEmailBody',
          factory.createArrowFunction(
            undefined,
            undefined,
            [],
            undefined,
            undefined,
            factory.createStringLiteral(emailOptions.emailVerificationBody),
          ),
        ),
      );
    }

    return factory.createObjectLiteralExpression(emailDefinitionAssignments, true);
  }

  private createExternalProvidersExpression(
    loginOptions: LoginOptions,
    callbackUrls?: readonly string[],
    logoutUrls?: readonly string[],
  ): ts.ObjectLiteralExpression {
    const providerAssignments: PropertyAssignment[] = [];

    if (loginOptions.googleLogin) {
      const googleConfig: Record<string, string> = {
        clientId: googleClientID,
        clientSecret: googleClientSecret,
      };
      if (loginOptions.googleScopes && loginOptions.googleScopes.length > 0) {
        googleConfig.scopes = loginOptions.googleScopes.join(' ');
      }
      providerAssignments.push(AuthRenderer.createProviderPropertyAssignment('google', googleConfig, loginOptions.googleAttributes));
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
      providerAssignments.push(AuthRenderer.createProviderPropertyAssignment('signInWithApple', appleConfig, loginOptions.appleAttributes));
    }

    if (loginOptions.amazonLogin) {
      const amazonConfig: Record<string, string> = {
        clientId: amazonClientID,
        clientSecret: amazonClientSecret,
      };
      if (loginOptions.amazonScopes && loginOptions.amazonScopes.length > 0) {
        amazonConfig.scopes = loginOptions.amazonScopes.join(' ');
      }
      providerAssignments.push(
        AuthRenderer.createProviderPropertyAssignment('loginWithAmazon', amazonConfig, loginOptions.amazonAttributes),
      );
    }

    if (loginOptions.facebookLogin) {
      const facebookConfig: Record<string, string> = {
        clientId: facebookClientID,
        clientSecret: facebookClientSecret,
      };
      if (loginOptions.facebookScopes && loginOptions.facebookScopes.length > 0) {
        facebookConfig.scopes = loginOptions.facebookScopes.join(' ');
      }
      providerAssignments.push(AuthRenderer.createProviderPropertyAssignment('facebook', facebookConfig, loginOptions.facebookAttributes));
    }

    if (loginOptions.samlLogin) {
      providerAssignments.push(
        factory.createPropertyAssignment(
          factory.createIdentifier('saml'),
          factory.createObjectLiteralExpression(AuthRenderer.createOidcSamlPropertyAssignments(loginOptions.samlLogin), true),
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
                    factory.createCallExpression(secretIdentifier, undefined, [
                      factory.createStringLiteral(`${oidcClientID}_${index + 1}`),
                    ]),
                  ),
                  factory.createPropertyAssignment(
                    factory.createIdentifier('clientSecret'),
                    factory.createCallExpression(secretIdentifier, undefined, [
                      factory.createStringLiteral(`${oidcClientSecret}_${index + 1}`),
                    ]),
                  ),
                  ...AuthRenderer.createOidcSamlPropertyAssignments(oidc),
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

  private createUserAttributeAssignments(
    standardAttributes: StandardAttributes | undefined,
    customAttributes: CustomAttributes | undefined,
  ): PropertyAssignment {
    const userAttributeIdentifier = factory.createIdentifier('userAttributes');
    const userAttributeProperties = [];

    if (standardAttributes !== undefined) {
      const standardAttributeProperties = Object.entries(standardAttributes).map(([key, value]) => {
        return factory.createPropertyAssignment(factory.createIdentifier(key), AuthRenderer.createStandardAttributeDefinition(value));
      });
      userAttributeProperties.push(...standardAttributeProperties);
    }

    if (customAttributes !== undefined) {
      const customAttributeProperties = Object.entries(customAttributes)
        .map(([key, value]) => {
          if (value !== undefined) {
            return factory.createPropertyAssignment(
              factory.createStringLiteral(key),
              AuthRenderer.createStandardAttributeDefinition(value),
            );
          }
          return undefined;
        })
        .filter((property): property is ts.PropertyAssignment => property !== undefined);
      userAttributeProperties.push(...customAttributeProperties);
    }

    return factory.createPropertyAssignment(userAttributeIdentifier, factory.createObjectLiteralExpression(userAttributeProperties, true));
  }

  private static createStandardAttributeDefinition(attribute: StandardAttribute | CustomAttribute): ts.ObjectLiteralExpression {
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
  }

  private static createProviderConfig(
    config: Record<string, string>,
    attributeMapping: AttributeMappingRule | undefined,
  ): ts.ObjectLiteralElementLike[] {
    const properties: ts.ObjectLiteralElementLike[] = [];

    Object.entries(config).forEach(([key, value]) => {
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

      Object.entries(attributeMapping).forEach(([key, value]) =>
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

  private static createProviderPropertyAssignment(
    name: string,
    config: Record<string, string>,
    attributeMapping: AttributeMappingRule | undefined,
  ): PropertyAssignment {
    return factory.createPropertyAssignment(
      factory.createIdentifier(name),
      factory.createObjectLiteralExpression(AuthRenderer.createProviderConfig(config, attributeMapping), true),
    );
  }

  private static createOidcSamlPropertyAssignments(
    config: Record<string, string | MetadataOptions | OidcEndPoints | AttributeMappingRule>,
  ): PropertyAssignment[] {
    return Object.entries(config).flatMap(([key, value]) => {
      if (typeof value === 'string') {
        return [factory.createPropertyAssignment(factory.createIdentifier(key), factory.createStringLiteral(value))];
      } else if (typeof value === 'object' && value !== null) {
        return [
          factory.createPropertyAssignment(
            factory.createIdentifier(key),
            factory.createObjectLiteralExpression(AuthRenderer.createOidcSamlPropertyAssignments(value), true),
          ),
        ];
      }
      return [];
    });
  }
}
