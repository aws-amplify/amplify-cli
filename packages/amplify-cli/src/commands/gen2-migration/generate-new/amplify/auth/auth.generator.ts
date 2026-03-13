import path from 'node:path';
import fs from 'node:fs/promises';
import ts from 'typescript';
import { UserPoolClientType } from '@aws-sdk/client-cognito-identity-provider';
import { Planner } from '../../../planner';
import { AmplifyMigrationOperation } from '../../../_operation';
import { BackendGenerator } from '../backend.generator';
import { Gen1App } from '../../_infra/gen1-app';
import { TS } from '../../_infra/ts';
import { AuthRenderOptions, AuthRenderer, AuthTrigger, FunctionAccess } from './auth.renderer';

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
export class AuthGenerator implements Planner {
  private readonly gen1App: Gen1App;
  private readonly backendGenerator: BackendGenerator;
  private readonly outputDir: string;
  private readonly defineAuth: AuthRenderer;
  private readonly access: FunctionAccess[] = [];
  private readonly triggers: AuthTrigger[] = [];

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
  public addFunctionAuthAccess(access: FunctionAccess): void {
    this.access.push(access);
  }

  public addTrigger(trigger: AuthTrigger): void {
    this.triggers.push(trigger);
  }

  /**
   * Plans the main auth generation operation (resource.ts + backend.ts overrides).
   */
  public async plan(): Promise<AmplifyMigrationOperation[]> {
    const authResourceName = this.gen1App.singleResourceName('auth', 'Cognito');
    const userPoolId = this.gen1App.metaOutput('auth', authResourceName, 'UserPoolId');
    const userPool = await this.gen1App.aws.fetchUserPool(userPoolId);

    const appClientIdWeb = this.gen1App.metaOutput('auth', authResourceName, 'AppClientIDWeb');
    const appClientId = this.gen1App.metaOutput('auth', authResourceName, 'AppClientID');
    const identityPoolId = this.gen1App.metaOutput('auth', authResourceName, 'IdentityPoolId');

    const [mfaConfig, webClient, userPoolClient, identityProviders, identityGroups, identityPool] = await Promise.all([
      this.gen1App.aws.fetchMfaConfig(userPoolId),
      appClientIdWeb ? this.gen1App.aws.fetchUserPoolClient(userPoolId, appClientIdWeb) : Promise.resolve(undefined),
      appClientId ? this.gen1App.aws.fetchUserPoolClient(userPoolId, appClientId) : Promise.resolve(undefined),
      this.gen1App.aws.fetchIdentityProviders(userPoolId),
      this.gen1App.aws.fetchIdentityGroups(userPoolId),
      identityPoolId ? this.gen1App.aws.fetchIdentityPool(identityPoolId) : Promise.resolve(undefined),
    ]);

    const renderOptions: AuthRenderOptions = {
      userPool,
      identityPool,
      identityProviders,
      identityGroups,
      webClient,
      mfaConfig,
      userPoolClient,
      triggers: this.triggers,
      access: this.access,
    };

    const authDir = path.join(this.outputDir, 'amplify', 'auth');
    const hasIdentityProviders =
      userPoolClient?.SupportedIdentityProviders !== undefined && userPoolClient.SupportedIdentityProviders.length > 0;

    return [
      {
        validate: async () => {
          return;
        },
        describe: async () => ['Generate amplify/auth/resource.ts'],
        execute: async () => {
          const nodes = this.defineAuth.render(renderOptions);
          let content = TS.printNodes(nodes);

          content = content.replace(/\(allow, _unused\)/g, '(allow: any)');
          content = content.replace(/(access: \(allow: any\) => \[[\s\S]*?\n {4}\])/g, '$1,');

          await fs.mkdir(authDir, { recursive: true });
          await fs.writeFile(path.join(authDir, 'resource.ts'), content, 'utf-8');

          this.contributeToBackend(renderOptions);

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
  private contributeToBackend(options: AuthRenderOptions): void {
    const authIdentifier = factory.createIdentifier('auth');
    this.backendGenerator.addImport('./auth/resource', ['auth']);
    this.backendGenerator.addDefineBackendProperty(factory.createShorthandPropertyAssignment(authIdentifier));

    // Password policy and username attributes overrides
    const userPoolOverrides = AuthRenderer.deriveUserPoolOverrides(options.userPool);
    if (Object.keys(userPoolOverrides).length > 0) {
      this.contributeUserPoolOverrides(userPoolOverrides);
    }

    // Identity pool: disable guest access
    if (options.identityPool?.AllowUnauthenticatedIdentities === false) {
      this.contributeIdentityPoolOverrides();
    }

    // cfnUserPoolClient override for OAuth flows (must come before addClient)
    if (options.webClient?.AllowedOAuthFlows) {
      this.backendGenerator.addConstFromBackend('cfnUserPoolClient', 'auth', 'resources', 'cfnResources', 'cfnUserPoolClient');
      this.backendGenerator.addStatement(TS.assignProp('cfnUserPoolClient', 'allowedOAuthFlows', options.webClient.AllowedOAuthFlows));
    }

    // User pool client overrides (native app client)
    if (options.userPoolClient) {
      this.contributeUserPoolClientOverrides(options.userPoolClient);
    }
  }

  /**
   * Generates cfnUserPool password policy and username attribute overrides.
   */
  private contributeUserPoolOverrides(overrides: Record<string, string | boolean | number | string[] | undefined>): void {
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
    this.backendGenerator.addConstFromBackend('cfnUserPool', 'auth', 'resources', 'cfnResources', 'cfnUserPool');

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
        this.backendGenerator.addStatement(TS.assignProp('cfnUserPool', overridePath, value));
      }
    }

    // cfnUserPool.policies = { passwordPolicy: { ... } }
    this.backendGenerator.addStatement(TS.assignProp('cfnUserPool', 'policies', policies));
  }

  /**
   * Generates cfnIdentityPool.allowUnauthenticatedIdentities = false.
   */
  private contributeIdentityPoolOverrides(): void {
    this.backendGenerator.addConstFromBackend('cfnIdentityPool', 'auth', 'resources', 'cfnResources', 'cfnIdentityPool');
    this.backendGenerator.addStatement(TS.assignProp('cfnIdentityPool', 'allowUnauthenticatedIdentities', false));
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
    this.backendGenerator.addConstFromBackend('userPool', 'auth', 'resources', 'userPool');

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
}
