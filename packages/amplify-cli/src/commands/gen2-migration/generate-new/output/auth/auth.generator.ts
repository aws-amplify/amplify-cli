import path from 'node:path';
import fs from 'node:fs/promises';
import ts from 'typescript';
import {
  GroupType,
  IdentityProviderType,
  IdentityProviderTypeType,
  LambdaConfigType,
  PasswordPolicyType,
  ProviderDescription,
  SchemaAttributeType,
  SoftwareTokenMfaConfigType,
  UserPoolClientType,
  UserPoolMfaType,
  UserPoolType,
} from '@aws-sdk/client-cognito-identity-provider';
import { Generator } from '../../generator';
import { AmplifyMigrationOperation } from '../../../_operation';
import { BackendGenerator } from '../backend.generator';
import { Gen1App } from '../../input/gen1-app';
import { printNodes } from '../../ts-writer';
import {
  Attribute,
  AttributeMappingRule,
  AuthAccess,
  AuthDefinition,
  AuthRenderer,
  AuthTriggerEvents,
  CustomAttribute,
  CustomAttributes,
  EmailOptions,
  FunctionAuthInfo,
  Lambda,
  LoginOptions,
  MultifactorOptions,
  OidcOptions,
  PasswordPolicyPath,
  PolicyOverrides,
  ReferenceAuth,
  SamlOptions,
  Scope,
  StandardAttribute,
  StandardAttributes,
} from './auth.renderer';

import { constFromBackend, assignProp, jsValue } from '../../ts-factory-utils';

const factory = ts.factory;

/**
 * Generates auth resource files and contributes to backend.ts.
 *
 * Reads the Gen1 Cognito configuration (user pool, identity pool,
 * identity providers, MFA, groups, triggers) and generates
 * amplify/auth/resource.ts with a defineAuth() call. Also contributes
 * auth imports and CDK overrides (password policy, user pool client
 * settings, identity pool config) to backend.ts.
 */
export class AuthGenerator implements Generator {
  private readonly gen1App: Gen1App;
  private readonly backendGenerator: BackendGenerator;
  private readonly outputDir: string;
  private readonly defineAuth: AuthRenderer;
  private readonly functions: FunctionAuthInfo[] = [];

  public constructor(gen1App: Gen1App, backendGenerator: BackendGenerator, outputDir: string) {
    this.gen1App = gen1App;
    this.backendGenerator = backendGenerator;
    this.outputDir = outputDir;
    this.defineAuth = new AuthRenderer();
  }

  /**
   * Registers a function's auth access permissions.
   * Called by FunctionGenerator before AuthGenerator.plan() runs.
   */
  public addFunctionAuthAccess(resourceName: string, authAccess: AuthAccess): void {
    this.functions.push({ resourceName, authAccess });
  }

  /**
   * Plans the main auth generation operation (resource.ts + backend.ts overrides).
   */
  public async plan(): Promise<AmplifyMigrationOperation[]> {
    const authCategory = await this.gen1App.fetchMetaCategory('auth');
    if (!authCategory) {
      return [];
    }

    // Check for reference auth (imported resources)
    const referenceAuth = await this.buildReferenceAuth(authCategory);
    if (referenceAuth) {
      return this.planReferenceAuth(referenceAuth);
    }

    // Standard auth: fetch all Cognito resources
    const resources = await this.gen1App.fetchResourcesByLogicalId();
    const userPool = await this.gen1App.aws.fetchUserPool(resources);
    if (!userPool) {
      return [];
    }

    const [mfaConfig, webClient, userPoolClient, identityProviders, identityGroups, identityPool, authTriggerConnections] =
      await Promise.all([
        this.gen1App.aws.fetchMfaConfig(resources),
        this.gen1App.aws.fetchWebClient(resources),
        this.gen1App.aws.fetchUserPoolClient(resources),
        this.gen1App.aws.fetchIdentityProviders(resources),
        this.gen1App.aws.fetchIdentityGroups(resources),
        this.gen1App.aws.fetchIdentityPool(resources),
        this.gen1App.fetchAuthTriggerConnections(),
      ]);

    // Build the AuthDefinition using the existing adapter
    const authDefinition = getAuthDefinition({
      userPool,
      identityPoolName: identityPool?.identityPoolName,
      identityProviders: identityProviders.map((p) => ({
        ProviderName: p.ProviderName,
        ProviderType: p.ProviderType,
        CreationDate: p.CreationDate,
        LastModifiedDate: p.LastModifiedDate,
      })),
      identityProvidersDetails: identityProviders,
      identityGroups,
      webClient,
      authTriggerConnections,
      guestLogin: identityPool?.guestLogin,
      mfaConfig: mfaConfig?.mfaConfig,
      totpConfig: mfaConfig?.totpConfig,
      userPoolClient,
    });

    return this.planStandardAuth(authDefinition);
  }

  private planReferenceAuth(authDefinition: AuthDefinition): AmplifyMigrationOperation[] {
    const authDir = path.join(this.outputDir, 'amplify', 'auth');

    return [
      {
        describe: async () => ['Generate amplify/auth/resource.ts (reference auth)'],
        execute: async () => {
          const nodes = this.defineAuth.render(authDefinition);
          const content = printNodes(nodes);

          await fs.mkdir(authDir, { recursive: true });
          await fs.writeFile(path.join(authDir, 'resource.ts'), content, 'utf-8');

          this.contributeToBackend(authDefinition);
        },
      },
    ];
  }

  private planStandardAuth(authDefinition: AuthDefinition): AmplifyMigrationOperation[] {
    const authDir = path.join(this.outputDir, 'amplify', 'auth');

    const hasIdentityProviders =
      authDefinition.userPoolClient?.SupportedIdentityProviders !== undefined &&
      authDefinition.userPoolClient.SupportedIdentityProviders.length > 0;

    return [
      {
        describe: async () => ['Generate amplify/auth/resource.ts'],
        execute: async () => {
          const nodes = this.defineAuth.render({ ...authDefinition, functions: this.functions });
          let content = printNodes(nodes);

          // Post-process: fix generated code patterns
          content = content.replace(/\(allow, _unused\)/g, '(allow: any)');
          content = content.replace(/(access: \(allow: any\) => \[[\s\S]*?\n {4}\])/g, '$1,');

          await fs.mkdir(authDir, { recursive: true });
          await fs.writeFile(path.join(authDir, 'resource.ts'), content, 'utf-8');

          this.contributeToBackend(authDefinition);

          if (hasIdentityProviders) {
            this.contributeProviderSetup();
          }
        },
      },
    ];
  }

  /**
   * Adds auth imports and CDK overrides to backend.ts.
   *
   * Generates password policy overrides, identity pool config,
   * and user pool client overrides as post-defineBackend statements.
   */
  private contributeToBackend(auth: AuthDefinition): void {
    const authIdentifier = factory.createIdentifier('auth');
    this.backendGenerator.addImport('./auth/resource', ['auth']);
    this.backendGenerator.addDefineBackendProperty(factory.createShorthandPropertyAssignment(authIdentifier));

    // Skip CDK overrides for reference auth (imported resources)
    if (auth.referenceAuth) return;

    // Password policy and username attributes overrides
    if (auth.userPoolOverrides && Object.keys(auth.userPoolOverrides).length > 0) {
      this.contributeUserPoolOverrides(auth.userPoolOverrides);
    }

    // Identity pool: disable guest access
    if (auth.guestLogin === false) {
      this.contributeIdentityPoolOverrides();
    }

    // cfnUserPoolClient override for OAuth flows (must come before addClient)
    if (auth.oAuthFlows) {
      this.backendGenerator.addStatement(constFromBackend('cfnUserPoolClient', 'auth', 'resources', 'cfnResources', 'cfnUserPoolClient'));
      this.backendGenerator.addStatement(createPropertyAssignment('cfnUserPoolClient', 'allowedOAuthFlows', auth.oAuthFlows));
    }

    // User pool client overrides (native app client)
    if (auth.userPoolClient) {
      this.contributeUserPoolClientOverrides(auth.userPoolClient);
    }
  }

  /**
   * Generates cfnUserPool password policy and username attribute overrides.
   */
  private contributeUserPoolOverrides(overrides: PolicyOverrides): void {
    const mappedPolicyType: Record<string, string> = {
      MinimumLength: 'minimumLength',
      RequireUppercase: 'requireUppercase',
      RequireLowercase: 'requireLowercase',
      RequireNumbers: 'requireNumbers',
      RequireSymbols: 'requireSymbols',
      PasswordHistorySize: 'passwordHistorySize',
      TemporaryPasswordValidityDays: 'temporaryPasswordValidityDays',
    };

    // const cfnUserPool = backend.auth.resources.cfnResources.cfnUserPool;
    this.backendGenerator.addStatement(createConstFromBackendPath('cfnUserPool', 'auth.resources.cfnResources.cfnUserPool'));

    const policies: { passwordPolicy: Record<string, number | string | boolean | string[]> } = {
      passwordPolicy: {},
    };

    for (const [overridePath, value] of Object.entries(overrides)) {
      if (overridePath.includes('PasswordPolicy')) {
        const policyKey = overridePath.split('.')[2];
        if (value !== undefined && policyKey in mappedPolicyType) {
          policies.passwordPolicy[mappedPolicyType[policyKey]] = value;
        }
      } else {
        // Handle non-password overrides (e.g., usernameAttributes)
        this.backendGenerator.addStatement(createPropertyAssignment('cfnUserPool', overridePath, value));
      }
    }

    // cfnUserPool.policies = { passwordPolicy: { ... } }
    this.backendGenerator.addStatement(createPropertyAssignment('cfnUserPool', 'policies', policies));
  }

  /**
   * Generates cfnIdentityPool.allowUnauthenticatedIdentities = false.
   */
  private contributeIdentityPoolOverrides(): void {
    this.backendGenerator.addStatement(createConstFromBackendPath('cfnIdentityPool', 'auth.resources.cfnResources.cfnIdentityPool'));
    this.backendGenerator.addStatement(createPropertyAssignment('cfnIdentityPool', 'allowUnauthenticatedIdentities', false));
  }

  /**
   * Generates userPool.addClient('NativeAppClient', { ... }) for the
   * Gen1 native app client configuration. When identity providers are
   * present, assigns the result to `const userPoolClient` and generates
   * the provider setup code and tryRemoveChild comment.
   */
  private contributeUserPoolClientOverrides(userPoolClient: UserPoolClientType): void {
    this.backendGenerator.addImport('aws-cdk-lib', ['Duration']);

    const hasIdentityProviders =
      userPoolClient.SupportedIdentityProviders !== undefined && userPoolClient.SupportedIdentityProviders.length > 0;

    if (hasIdentityProviders) {
      this.backendGenerator.addImport('aws-cdk-lib/aws-cognito', ['OAuthScope', 'UserPoolClientIdentityProvider']);
    }

    // const userPool = backend.auth.resources.userPool;
    this.backendGenerator.addStatement(createConstFromBackendPath('userPool', 'auth.resources.userPool'));

    const clientProps: ts.PropertyAssignment[] = [];

    if (userPoolClient.RefreshTokenValidity !== undefined) {
      clientProps.push(
        factory.createPropertyAssignment(
          'refreshTokenValidity',
          factory.createCallExpression(
            factory.createPropertyAccessExpression(factory.createIdentifier('Duration'), factory.createIdentifier('days')),
            undefined,
            [factory.createNumericLiteral(userPoolClient.RefreshTokenValidity)],
          ),
        ),
      );
    }

    if (userPoolClient.EnableTokenRevocation !== undefined) {
      clientProps.push(
        factory.createPropertyAssignment(
          'enableTokenRevocation',
          userPoolClient.EnableTokenRevocation ? factory.createTrue() : factory.createFalse(),
        ),
      );
    }

    if (userPoolClient.EnablePropagateAdditionalUserContextData !== undefined) {
      clientProps.push(
        factory.createPropertyAssignment(
          'enablePropagateAdditionalUserContextData',
          userPoolClient.EnablePropagateAdditionalUserContextData ? factory.createTrue() : factory.createFalse(),
        ),
      );
    }

    if (userPoolClient.AuthSessionValidity !== undefined) {
      clientProps.push(
        factory.createPropertyAssignment(
          'authSessionValidity',
          factory.createCallExpression(
            factory.createPropertyAccessExpression(factory.createIdentifier('Duration'), factory.createIdentifier('minutes')),
            undefined,
            [factory.createNumericLiteral(userPoolClient.AuthSessionValidity)],
          ),
        ),
      );
    }

    // SupportedIdentityProviders
    if (hasIdentityProviders) {
      const providerMap: Record<string, string> = {
        COGNITO: 'COGNITO',
        Facebook: 'FACEBOOK',
        Google: 'GOOGLE',
        LoginWithAmazon: 'AMAZON',
        SignInWithApple: 'APPLE',
      };
      const providerElements = userPoolClient.SupportedIdentityProviders!.map((provider) => {
        const mapped = providerMap[provider] ?? provider.toUpperCase();
        return factory.createPropertyAccessExpression(
          factory.createIdentifier('UserPoolClientIdentityProvider'),
          factory.createIdentifier(mapped),
        );
      });
      clientProps.push(
        factory.createPropertyAssignment('supportedIdentityProviders', factory.createArrayLiteralExpression(providerElements, true)),
      );
    }

    // oAuth block
    if (
      userPoolClient.AllowedOAuthFlows?.length ||
      userPoolClient.AllowedOAuthScopes?.length ||
      userPoolClient.CallbackURLs?.length ||
      userPoolClient.LogoutURLs?.length
    ) {
      const oAuthProps: ts.PropertyAssignment[] = [];

      if (userPoolClient.CallbackURLs?.length) {
        oAuthProps.push(
          factory.createPropertyAssignment(
            'callbackUrls',
            factory.createArrayLiteralExpression(userPoolClient.CallbackURLs.map((url) => factory.createStringLiteral(url))),
          ),
        );
      }

      if (userPoolClient.LogoutURLs?.length) {
        oAuthProps.push(
          factory.createPropertyAssignment(
            'logoutUrls',
            factory.createArrayLiteralExpression(userPoolClient.LogoutURLs.map((url) => factory.createStringLiteral(url))),
          ),
        );
      }

      if (userPoolClient.AllowedOAuthFlows?.length) {
        oAuthProps.push(
          factory.createPropertyAssignment(
            'flows',
            factory.createObjectLiteralExpression([
              factory.createPropertyAssignment(
                'authorizationCodeGrant',
                userPoolClient.AllowedOAuthFlows.includes('code') ? factory.createTrue() : factory.createFalse(),
              ),
              factory.createPropertyAssignment(
                'implicitCodeGrant',
                userPoolClient.AllowedOAuthFlows.includes('implicit') ? factory.createTrue() : factory.createFalse(),
              ),
              factory.createPropertyAssignment(
                'clientCredentials',
                userPoolClient.AllowedOAuthFlows.includes('client_credentials') ? factory.createTrue() : factory.createFalse(),
              ),
            ]),
          ),
        );
      }

      if (userPoolClient.AllowedOAuthScopes?.length) {
        const scopeMap: Record<string, string> = {
          phone: 'PHONE',
          email: 'EMAIL',
          openid: 'OPENID',
          profile: 'PROFILE',
          'aws.cognito.signin.user.admin': 'COGNITO_ADMIN',
        };
        const scopeElements = userPoolClient.AllowedOAuthScopes.filter((s) => scopeMap[s]).map((scope) =>
          factory.createPropertyAccessExpression(factory.createIdentifier('OAuthScope'), factory.createIdentifier(scopeMap[scope])),
        );
        oAuthProps.push(factory.createPropertyAssignment('scopes', factory.createArrayLiteralExpression(scopeElements, true)));
      }

      clientProps.push(factory.createPropertyAssignment('oAuth', factory.createObjectLiteralExpression(oAuthProps, true)));
    }

    // Commented-out flows property when OAuth flows exist
    if (userPoolClient.AllowedOAuthFlows?.length) {
      clientProps.push(
        factory.createPropertyAssignment(
          factory.createIdentifier('// flows'),
          factory.createArrayLiteralExpression(userPoolClient.AllowedOAuthFlows.map((flow) => factory.createStringLiteral(flow, true))),
        ),
      );
    }

    // disableOAuth
    const hasOAuth = (userPoolClient.AllowedOAuthFlows?.length ?? 0) > 0;
    clientProps.push(factory.createPropertyAssignment('disableOAuth', hasOAuth ? factory.createFalse() : factory.createTrue()));

    // generateSecret
    clientProps.push(
      factory.createPropertyAssignment('generateSecret', userPoolClient.ClientSecret ? factory.createTrue() : factory.createFalse()),
    );

    // Build the addClient call
    const addClientCall = factory.createCallExpression(
      factory.createPropertyAccessExpression(factory.createIdentifier('userPool'), factory.createIdentifier('addClient')),
      undefined,
      [factory.createStringLiteral('NativeAppClient'), factory.createObjectLiteralExpression(clientProps, true)],
    );

    if (hasIdentityProviders) {
      // const userPoolClient = userPool.addClient(...)
      this.backendGenerator.addStatement(
        factory.createVariableStatement(
          undefined,
          factory.createVariableDeclarationList(
            [factory.createVariableDeclaration(factory.createIdentifier('userPoolClient'), undefined, undefined, addClientCall)],
            ts.NodeFlags.Const,
          ),
        ),
      );
    } else {
      // userPool.addClient(...)
      this.backendGenerator.addStatement(factory.createExpressionStatement(addClientCall));
    }
  }

  /**
   * Generates the providerSetupResult code and the commented-out
   * tryRemoveChild line for apps with social identity providers.
   * Must run after storage overrides so it appears in the correct
   * position in backend.ts.
   */
  private contributeProviderSetup(): void {
    // const providerSetupResult = (backend.auth.stack.node.children.find(child => child.node.id === "amplifyAuth") as any).providerSetupResult;
    const findCall = factory.createCallExpression(
      factory.createPropertyAccessExpression(
        factory.createPropertyAccessExpression(
          factory.createPropertyAccessExpression(
            factory.createPropertyAccessExpression(
              factory.createPropertyAccessExpression(factory.createIdentifier('backend'), factory.createIdentifier('auth')),
              factory.createIdentifier('stack'),
            ),
            factory.createIdentifier('node'),
          ),
          factory.createIdentifier('children'),
        ),
        factory.createIdentifier('find'),
      ),
      undefined,
      [
        factory.createArrowFunction(
          undefined,
          undefined,
          [factory.createParameterDeclaration(undefined, undefined, factory.createIdentifier('child'))],
          undefined,
          factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
          factory.createBinaryExpression(
            factory.createPropertyAccessExpression(
              factory.createPropertyAccessExpression(factory.createIdentifier('child'), factory.createIdentifier('node')),
              factory.createIdentifier('id'),
            ),
            factory.createToken(ts.SyntaxKind.EqualsEqualsEqualsToken),
            factory.createStringLiteral('amplifyAuth'),
          ),
        ),
      ],
    );

    const providerSetupDecl = factory.createVariableStatement(
      undefined,
      factory.createVariableDeclarationList(
        [
          factory.createVariableDeclaration(
            'providerSetupResult',
            undefined,
            undefined,
            factory.createPropertyAccessExpression(
              factory.createParenthesizedExpression(
                factory.createAsExpression(findCall, factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword)),
              ),
              factory.createIdentifier('providerSetupResult'),
            ),
          ),
        ],
        ts.NodeFlags.Const,
      ),
    );
    this.backendGenerator.addStatement(providerSetupDecl);

    // Object.keys(providerSetupResult).forEach(...)
    const forEachStatement = factory.createExpressionStatement(
      factory.createCallExpression(
        factory.createPropertyAccessExpression(
          factory.createCallExpression(
            factory.createPropertyAccessExpression(factory.createIdentifier('Object'), factory.createIdentifier('keys')),
            undefined,
            [factory.createIdentifier('providerSetupResult')],
          ),
          factory.createIdentifier('forEach'),
        ),
        undefined,
        [
          factory.createArrowFunction(
            undefined,
            undefined,
            [factory.createParameterDeclaration(undefined, undefined, factory.createIdentifier('provider'))],
            undefined,
            factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
            factory.createBlock(
              [
                factory.createVariableStatement(
                  undefined,
                  factory.createVariableDeclarationList(
                    [
                      factory.createVariableDeclaration(
                        'providerSetupPropertyValue',
                        undefined,
                        undefined,
                        factory.createElementAccessExpression(
                          factory.createIdentifier('providerSetupResult'),
                          factory.createIdentifier('provider'),
                        ),
                      ),
                    ],
                    ts.NodeFlags.Const,
                  ),
                ),
                factory.createIfStatement(
                  factory.createLogicalAnd(
                    factory.createPropertyAccessExpression(
                      factory.createIdentifier('providerSetupPropertyValue'),
                      factory.createIdentifier('node'),
                    ),
                    factory.createCallExpression(
                      factory.createPropertyAccessExpression(
                        factory.createCallExpression(
                          factory.createPropertyAccessExpression(
                            factory.createPropertyAccessExpression(
                              factory.createPropertyAccessExpression(
                                factory.createIdentifier('providerSetupPropertyValue'),
                                factory.createIdentifier('node'),
                              ),
                              factory.createIdentifier('id'),
                            ),
                            factory.createIdentifier('toLowerCase'),
                          ),
                          undefined,
                          [],
                        ),
                        factory.createIdentifier('endsWith'),
                      ),
                      undefined,
                      [factory.createStringLiteral('idp')],
                    ),
                  ),
                  factory.createBlock(
                    [
                      factory.createExpressionStatement(
                        factory.createCallExpression(
                          factory.createPropertyAccessExpression(
                            factory.createPropertyAccessExpression(
                              factory.createIdentifier('userPoolClient'),
                              factory.createIdentifier('node'),
                            ),
                            factory.createIdentifier('addDependency'),
                          ),
                          undefined,
                          [factory.createIdentifier('providerSetupPropertyValue')],
                        ),
                      ),
                    ],
                    true,
                  ),
                ),
              ],
              true,
            ),
          ),
        ],
      ),
    );
    this.backendGenerator.addStatement(forEachStatement);

    // // backend.auth.resources.userPool.node.tryRemoveChild("UserPoolDomain");
    const commentedStatement = factory.createExpressionStatement(
      factory.createCallExpression(
        factory.createPropertyAccessExpression(
          factory.createPropertyAccessExpression(
            factory.createIdentifier('// backend.auth.resources.userPool'),
            factory.createIdentifier('node'),
          ),
          factory.createIdentifier('tryRemoveChild'),
        ),
        undefined,
        [factory.createStringLiteral('UserPoolDomain')],
      ),
    );
    this.backendGenerator.addStatement(commentedStatement);
  }

  /**
   * Checks if the auth category uses imported (reference) resources.
   */
  private async buildReferenceAuth(authCategory: Record<string, unknown>): Promise<AuthDefinition | undefined> {
    const isImported = Object.values(authCategory).some(
      (value) =>
        typeof value === 'object' &&
        value !== null &&
        'serviceType' in value &&
        (value as Record<string, unknown>).serviceType === 'imported',
    );
    if (!isImported) return undefined;

    const firstAuth = Object.values(authCategory)[0] as Record<string, unknown>;
    const output = firstAuth?.output as Record<string, string> | undefined;
    const userPoolId = output?.UserPoolId;
    const userPoolClientId = output?.AppClientIDWeb;
    const identityPoolId = output?.IdentityPoolId;

    if (!userPoolId && !userPoolClientId && !identityPoolId) {
      throw new Error('No user pool or identity pool found for import.');
    }

    const roles = identityPoolId ? await this.gen1App.aws.fetchIdentityPoolRoles(identityPoolId) : undefined;
    const groups = userPoolId ? await this.gen1App.aws.fetchGroupsByUserPoolId(userPoolId) : undefined;

    return {
      referenceAuth: {
        userPoolId,
        userPoolClientId,
        identityPoolId,
        unauthRoleArn: roles?.unauthenticated,
        authRoleArn: roles?.authenticated,
        groups,
      },
    };
  }
}
// ── Auth adapter functions ─────────────────────────────────────────
// Converts Cognito SDK types to AuthDefinition. Inlined from the
// former auth-adapter.ts to eliminate the unjustified layer boundary
// (guideline 2).

type AuthTriggerConnectionSourceMap = Partial<Record<keyof LambdaConfigType, string>>;

interface AuthSynthesizerOptions {
  readonly userPool: UserPoolType;
  readonly identityPoolName?: string;
  readonly identityProviders?: readonly ProviderDescription[];
  readonly identityProvidersDetails?: readonly IdentityProviderType[];
  readonly identityGroups?: readonly GroupType[];
  readonly webClient?: UserPoolClientType;
  readonly authTriggerConnections?: AuthTriggerConnectionSourceMap;
  readonly referenceAuth?: ReferenceAuth;
  readonly guestLogin?: boolean;
  readonly mfaConfig?: UserPoolMfaType;
  readonly totpConfig?: SoftwareTokenMfaConfigType;
  readonly userPoolClient?: UserPoolClientType;
}

const COGNITO_TRIGGERS_TO_SKIP = ['PreTokenGenerationConfig'];

const MAPPED_USER_ATTRIBUTE_NAME: Record<string, string> = {
  address: 'address',
  birthdate: 'birthdate',
  email: 'email',
  family_name: 'familyName',
  gender: 'gender',
  given_name: 'givenName',
  locale: 'locale',
  middle_name: 'middleName',
  name: 'fullname',
  nickname: 'nickname',
  phone_number: 'phoneNumber',
  picture: 'profilePicture',
  preferred_username: 'preferredUsername',
  profile: 'profilePage',
  zoneinfo: 'timezone',
  updated_at: 'lastUpdateTime',
  website: 'website',
};

const MAP_IDENTITY_PROVIDER: Record<string, [string, string]> = {
  [IdentityProviderTypeType.Google]: ['googleLogin', 'googleAttributes'],
  [IdentityProviderTypeType.SignInWithApple]: ['appleLogin', 'appleAttributes'],
  [IdentityProviderTypeType.LoginWithAmazon]: ['amazonLogin', 'amazonAttributes'],
  [IdentityProviderTypeType.Facebook]: ['facebookLogin', 'facebookAttributes'],
};

function getPasswordPolicyOverrides(passwordPolicy: Partial<PasswordPolicyType>): Partial<PolicyOverrides> {
  const policyOverrides: Partial<PolicyOverrides> = {};
  const passwordOverridePath = (policyKey: keyof PasswordPolicyType): PasswordPolicyPath => `Policies.PasswordPolicy.${policyKey}`;
  for (const key of Object.keys(passwordPolicy)) {
    const typedKey = key as keyof PasswordPolicyType;
    if (passwordPolicy[typedKey] !== undefined) {
      policyOverrides[passwordOverridePath(typedKey)] = passwordPolicy[typedKey];
    }
  }
  return policyOverrides;
}

function getUserPoolOverrides(userPool: UserPoolType): Partial<PolicyOverrides> {
  const userPoolOverrides: Partial<PolicyOverrides> = {};
  Object.assign(userPoolOverrides, getPasswordPolicyOverrides(userPool.Policies?.PasswordPolicy ?? {}));
  if (userPool.UsernameAttributes === undefined || userPool.UsernameAttributes.length === 0) {
    userPoolOverrides.usernameAttributes = undefined;
  } else {
    userPoolOverrides.usernameAttributes = userPool.UsernameAttributes;
  }
  return userPoolOverrides;
}

function getMfaConfiguration(mfaConfig?: UserPoolMfaType, totpConfig?: SoftwareTokenMfaConfigType): MultifactorOptions {
  if (mfaConfig === 'ON') {
    return { mode: 'REQUIRED', sms: true, totp: totpConfig?.Enabled ?? false };
  }
  if (mfaConfig === 'OPTIONAL') {
    return { mode: 'OPTIONAL', sms: true, totp: totpConfig?.Enabled ?? false };
  }
  return { mode: 'OFF' };
}

function getEmailConfig(userPool: UserPoolType): EmailOptions {
  return {
    emailVerificationBody: userPool.EmailVerificationMessage ?? '',
    emailVerificationSubject: userPool.EmailVerificationSubject ?? '',
  };
}

function getStandardUserAttributes(signupAttributes: SchemaAttributeType[] | undefined): StandardAttributes {
  return (
    signupAttributes?.reduce((standardAttributes: StandardAttributes, attribute: SchemaAttributeType) => {
      const standardAttribute: StandardAttribute = {
        required: attribute.Required,
        mutable: attribute.Mutable,
      };
      if (attribute.Name !== undefined && attribute.Name in MAPPED_USER_ATTRIBUTE_NAME && attribute.Required) {
        return {
          ...standardAttributes,
          [MAPPED_USER_ATTRIBUTE_NAME[attribute.Name] as Attribute]: standardAttribute,
        };
      }
      return standardAttributes;
    }, {} as StandardAttributes) || {}
  );
}

function getCustomUserAttributes(signupAttributes: SchemaAttributeType[] | undefined): CustomAttributes {
  return (
    signupAttributes?.reduce((customAttributes: CustomAttributes, attribute: SchemaAttributeType) => {
      if (attribute.Name !== undefined && attribute.Name.startsWith('custom:')) {
        const constraints =
          attribute.NumberAttributeConstraints && Object.keys(attribute.NumberAttributeConstraints).length > 0
            ? { min: Number(attribute.NumberAttributeConstraints.MinValue), max: Number(attribute.NumberAttributeConstraints.MaxValue) }
            : attribute.StringAttributeConstraints && Object.keys(attribute.StringAttributeConstraints).length > 0
            ? {
                minLen: Number(attribute.StringAttributeConstraints.MinLength),
                maxLen: Number(attribute.StringAttributeConstraints.MaxLength),
              }
            : {};

        const customAttribute: CustomAttribute = {
          mutable: attribute.Mutable,
          dataType: attribute.AttributeDataType,
          ...constraints,
        };

        return {
          ...customAttributes,
          [attribute.Name]: customAttribute,
        };
      }
      return customAttributes;
    }, {} as CustomAttributes) || {}
  );
}

function getGroups(identityGroups?: readonly GroupType[]): string[] {
  if (!identityGroups || identityGroups.length === 0) {
    return [];
  }
  return identityGroups
    .filter((group) => group.Precedence !== undefined)
    .sort((a, b) => (a.Precedence || 0) - (b.Precedence || 0))
    .map((group) => group.GroupName)
    .filter((groupName): groupName is string => groupName !== undefined);
}

function getScopes(scopes: string[]): Scope[] {
  return scopes.filter((scope): scope is Scope => ['phone', 'email', 'openid', 'profile', 'aws.cognito.signin.user.admin'].includes(scope));
}

function getProviderSpecificScopes(providerDetails: Record<string, string>): string[] {
  const scopeFields = ['authorized_scopes', 'scope', 'scopes'];
  for (const field of scopeFields) {
    if (providerDetails[field]) {
      return providerDetails[field].split(/[\s,]+/).filter((scope) => scope.length > 0);
    }
  }
  return [];
}

function mappedLambdaConfigKey(key: keyof LambdaConfigType): AuthTriggerEvents {
  switch (key) {
    case 'PreSignUp':
      return 'preSignUp';
    case 'CustomMessage':
      return 'customMessage';
    case 'UserMigration':
      return 'userMigration';
    case 'PostConfirmation':
      return 'postConfirmation';
    case 'PreAuthentication':
      return 'preAuthentication';
    case 'PostAuthentication':
      return 'postAuthentication';
    case 'PreTokenGeneration':
      return 'preTokenGeneration';
    case 'DefineAuthChallenge':
      return 'defineAuthChallenge';
    case 'CreateAuthChallenge':
      return 'createAuthChallenge';
    case 'VerifyAuthChallengeResponse':
      return 'verifyAuthChallengeResponse';
    default:
      throw new Error(`Could not map the provided key: ${key}`);
  }
}

function getAuthTriggers(
  lambdaConfig: LambdaConfigType,
  triggerSourceFiles: AuthTriggerConnectionSourceMap,
): Partial<Record<AuthTriggerEvents, Lambda>> {
  return Object.keys(lambdaConfig)
    .filter((triggerName) => !COGNITO_TRIGGERS_TO_SKIP.includes(triggerName))
    .reduce((prev, key) => {
      const typedKey = key as keyof LambdaConfigType;
      prev[mappedLambdaConfigKey(typedKey)] = { source: triggerSourceFiles[typedKey] ?? '' };
      return prev;
    }, {} as Partial<Record<AuthTriggerEvents, Lambda>>);
}

function filterAttributeMapping(attributeMapping: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(attributeMapping)
      .filter(([key]) => Object.keys(MAPPED_USER_ATTRIBUTE_NAME).includes(key))
      .map(([key, value]) => [MAPPED_USER_ATTRIBUTE_NAME[key], value]),
  );
}

function getAuthDefinition({
  userPool,
  identityPoolName,
  identityProviders,
  identityProvidersDetails,
  identityGroups,
  webClient,
  authTriggerConnections,
  guestLogin,
  mfaConfig,
  totpConfig,
  userPoolClient,
}: AuthSynthesizerOptions): AuthDefinition {
  // Collect login flags from identity providers
  let googleLogin = false;
  let amazonLogin = false;
  let appleLogin = false;
  let facebookLogin = false;

  if (identityProviders !== undefined) {
    for (const provider of identityProviders) {
      const loginWithProperty = MAP_IDENTITY_PROVIDER[provider?.ProviderType as keyof typeof MAP_IDENTITY_PROVIDER];
      if (loginWithProperty !== undefined) {
        const loginProperty = loginWithProperty[0];
        if (loginProperty === 'googleLogin') googleLogin = true;
        else if (loginProperty === 'amazonLogin') amazonLogin = true;
        else if (loginProperty === 'appleLogin') appleLogin = true;
        else if (loginProperty === 'facebookLogin') facebookLogin = true;
      }
    }
  }

  // Collect OIDC/SAML providers, attribute mappings, and scopes
  let oidcLogin: OidcOptions[] = [];
  let samlLogin: SamlOptions | undefined;
  let googleAttributes: AttributeMappingRule | undefined;
  let amazonAttributes: AttributeMappingRule | undefined;
  let appleAttributes: AttributeMappingRule | undefined;
  let facebookAttributes: AttributeMappingRule | undefined;
  let googleScopes: string[] | undefined;
  let facebookScopes: string[] | undefined;
  let amazonScopes: string[] | undefined;
  let appleScopes: string[] | undefined;

  if (identityProvidersDetails) {
    const oidcOptions: OidcOptions[] = [];

    for (const provider of identityProvidersDetails) {
      const { ProviderType, ProviderName, ProviderDetails, AttributeMapping } = provider;

      if (ProviderType === IdentityProviderTypeType.OIDC && ProviderDetails) {
        const { oidc_issuer, authorize_url, token_url, attributes_url, jwks_uri } = ProviderDetails;
        const endpoints =
          authorize_url && token_url && attributes_url && jwks_uri
            ? { authorization: authorize_url, token: token_url, userInfo: attributes_url, jwksUri: jwks_uri }
            : undefined;
        oidcOptions.push({
          issuerUrl: oidc_issuer,
          ...(ProviderName && { name: ProviderName }),
          ...(endpoints && { endpoints }),
          ...(AttributeMapping && { attributeMapping: filterAttributeMapping(AttributeMapping) as AttributeMappingRule }),
        });
      } else if (ProviderType === IdentityProviderTypeType.SAML && ProviderDetails) {
        const { metadataURL, metadataContent } = ProviderDetails;
        samlLogin = {
          metadata: {
            metadataContent: metadataURL || metadataContent,
            metadataType: metadataURL ? 'URL' : 'FILE',
          },
          ...(ProviderName && { name: ProviderName }),
          ...(AttributeMapping && { attributeMapping: filterAttributeMapping(AttributeMapping) as AttributeMappingRule }),
        };
      } else {
        if (AttributeMapping) {
          const filteredMapping = filterAttributeMapping(AttributeMapping) as AttributeMappingRule;
          const attributeProperty = MAP_IDENTITY_PROVIDER[provider?.ProviderType as keyof typeof MAP_IDENTITY_PROVIDER]?.[1];
          if (attributeProperty === 'googleAttributes') googleAttributes = filteredMapping;
          else if (attributeProperty === 'amazonAttributes') amazonAttributes = filteredMapping;
          else if (attributeProperty === 'appleAttributes') appleAttributes = filteredMapping;
          else if (attributeProperty === 'facebookAttributes') facebookAttributes = filteredMapping;
        }

        if (ProviderDetails) {
          const providerSpecificScopes = getProviderSpecificScopes(ProviderDetails);
          if (providerSpecificScopes.length > 0) {
            const mappedScopes = providerSpecificScopes
              .map((scope) => (scope === 'public_profile' ? 'profile' : scope))
              .filter((scope) => ['phone', 'email', 'openid', 'profile', 'aws.cognito.signin.user.admin'].includes(scope));

            if (ProviderType === IdentityProviderTypeType.Google) googleScopes = mappedScopes;
            else if (ProviderType === IdentityProviderTypeType.Facebook) facebookScopes = mappedScopes;
            else if (ProviderType === IdentityProviderTypeType.LoginWithAmazon) amazonScopes = mappedScopes;
            else if (ProviderType === IdentityProviderTypeType.SignInWithApple) appleScopes = mappedScopes;
          }
        }
      }
    }
    oidcLogin = oidcOptions;
  }

  const loginWith: LoginOptions = {
    email: true,
    ...(googleLogin && { googleLogin }),
    ...(amazonLogin && { amazonLogin }),
    ...(appleLogin && { appleLogin }),
    ...(facebookLogin && { facebookLogin }),
    ...(oidcLogin.length > 0 && { oidcLogin }),
    ...(samlLogin && { samlLogin }),
    ...(googleAttributes && { googleAttributes }),
    ...(amazonAttributes && { amazonAttributes }),
    ...(appleAttributes && { appleAttributes }),
    ...(facebookAttributes && { facebookAttributes }),
    ...(googleScopes && { googleScopes }),
    ...(facebookScopes && { facebookScopes }),
    ...(amazonScopes && { amazonScopes }),
    ...(appleScopes && { appleScopes }),
    ...((userPool.EmailVerificationMessage || userPool.EmailVerificationSubject) && { emailOptions: getEmailConfig(userPool) }),
    ...(webClient?.CallbackURLs && { callbackURLs: webClient.CallbackURLs }),
    ...(webClient?.LogoutURLs && { logoutURLs: webClient.LogoutURLs }),
    ...(webClient?.AllowedOAuthScopes && { scopes: getScopes(webClient.AllowedOAuthScopes) }),
  };

  return {
    loginOptions: loginWith,
    mfa: getMfaConfiguration(mfaConfig, totpConfig),
    standardUserAttributes: getStandardUserAttributes(userPool.SchemaAttributes),
    customUserAttributes: getCustomUserAttributes(userPool.SchemaAttributes),
    groups: getGroups(identityGroups),
    userPoolOverrides: getUserPoolOverrides(userPool),
    lambdaTriggers: getAuthTriggers(userPool.LambdaConfig ?? {}, authTriggerConnections ?? {}),
    guestLogin,
    identityPoolName,
    oAuthFlows: webClient?.AllowedOAuthFlows,
    readAttributes: webClient?.ReadAttributes,
    writeAttributes: webClient?.WriteAttributes,
    userPoolClient,
  };
}

// ── Backend.ts helper functions ────────────────────────────────────
// Promoted to ts-factory-utils.ts: constFromBackend, assignProp, jsValue.
// The aliases below keep the auth-generator call sites unchanged.
const createConstFromBackendPath = (varName: string, propertyPath: string): ts.VariableStatement =>
  constFromBackend(varName, ...propertyPath.split('.'));

const createPropertyAssignment = (
  varName: string,
  property: string,
  value: number | string | boolean | string[] | object | undefined,
): ts.ExpressionStatement => assignProp(varName, property, value);

const getOverrideValue = jsValue;
