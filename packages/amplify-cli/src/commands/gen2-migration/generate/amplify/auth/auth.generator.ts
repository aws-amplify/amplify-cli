import path from 'node:path';
import fs from 'node:fs/promises';
import ts from 'typescript';
import { UserPoolClientType } from '@aws-sdk/client-cognito-identity-provider';
import { Planner } from '../../../_infra/planner';
import { AmplifyMigrationOperation } from '../../../_infra/operation';
import { BackendGenerator } from '../backend.generator';
import { Gen1App, DiscoveredResource } from '../../_infra/gen1-app';
import { TS, newLineIdentifier } from '../../_infra/ts';
import { AuthRenderOptions, AuthRenderer, AuthTrigger, FunctionAccess } from './auth.renderer';

const factory = ts.factory;

/**
 * Generates auth resource files and contributes to backend.ts.
 *
 * Reads the Gen1 Cognito configuration and generates
 * amplify/auth/resource.ts with defineAuth() + applyEscapeHatches().
 * Contributes namespace import, defineBackend entry, and
 * applyEscapeHatches call to backend.ts.
 */
export class AuthGenerator implements Planner {
  private readonly gen1App: Gen1App;
  private readonly backendGenerator: BackendGenerator;
  private readonly outputDir: string;
  private readonly resource: DiscoveredResource;
  private readonly defineAuth: AuthRenderer;
  private readonly access: FunctionAccess[] = [];
  private readonly triggers: AuthTrigger[] = [];

  public constructor(gen1App: Gen1App, backendGenerator: BackendGenerator, outputDir: string, resource: DiscoveredResource) {
    this.gen1App = gen1App;
    this.backendGenerator = backendGenerator;
    this.outputDir = outputDir;
    this.resource = resource;
    this.defineAuth = new AuthRenderer();
  }

  /** Registers a function's auth access permissions. */
  public addFunctionAuthAccess(access: FunctionAccess): void {
    this.access.push(access);
  }

  public addTrigger(trigger: AuthTrigger): void {
    this.triggers.push(trigger);
  }

  /** Plans the main auth generation operation. */
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
        resource: this.resource,
        validate: () => undefined,
        describe: async () => ['Generate amplify/auth/resource.ts'],
        execute: async () => {
          // Render the base defineAuth nodes
          const baseNodes = this.defineAuth.render(renderOptions);

          // Build the applyEscapeHatches function
          const escapeHatchStatements = this.buildEscapeHatchStatements(renderOptions, hasIdentityProviders);
          const additionalImports = this.buildAdditionalImports(renderOptions, hasIdentityProviders);

          // Build the applyEscapeHatches function declaration
          const applyEscapeHatchesDecl = factory.createFunctionDeclaration(
            [factory.createModifier(ts.SyntaxKind.ExportKeyword)],
            undefined,
            'applyEscapeHatches',
            undefined,
            [factory.createParameterDeclaration(undefined, undefined, 'backend', undefined, factory.createTypeReferenceNode('Backend'))],
            undefined,
            factory.createBlock(escapeHatchStatements, true),
          );

          // Build Backend type import
          const backendTypeImport = factory.createImportDeclaration(
            undefined,
            factory.createImportClause(
              true,
              undefined,
              factory.createNamedImports([factory.createImportSpecifier(false, undefined, factory.createIdentifier('Backend'))]),
            ),
            factory.createStringLiteral('../backend'),
          );

          // Build additional import declarations
          const additionalImportDecls: ts.ImportDeclaration[] = [];
          for (const [source, identifiers] of Object.entries(additionalImports)) {
            const importSpecifiers = Array.from(identifiers).map((id) =>
              factory.createImportSpecifier(false, undefined, factory.createIdentifier(id)),
            );
            additionalImportDecls.push(
              factory.createImportDeclaration(
                undefined,
                factory.createImportClause(false, undefined, factory.createNamedImports(importSpecifiers)),
                factory.createStringLiteral(source),
              ),
            );
          }

          // Reconstruct the full file
          const allNodes: ts.Node[] = [];
          let foundFirstNonImport = false;
          for (const node of baseNodes) {
            if (!foundFirstNonImport && ts.isImportDeclaration(node as ts.Node)) {
              allNodes.push(node);
            } else {
              if (!foundFirstNonImport) {
                for (const decl of additionalImportDecls) {
                  allNodes.push(decl);
                }
                allNodes.push(backendTypeImport);
                foundFirstNonImport = true;
              }
              allNodes.push(node);
            }
          }
          if (!foundFirstNonImport) {
            for (const decl of additionalImportDecls) {
              allNodes.push(decl);
            }
            allNodes.push(backendTypeImport);
          }

          // Add the applyEscapeHatches function
          allNodes.push(newLineIdentifier);
          allNodes.push(applyEscapeHatchesDecl);

          const nodeArray = factory.createNodeArray(allNodes as ts.Statement[]);
          let content = TS.printNodes(nodeArray);

          content = content.replace(/\(allow, _unused\)/g, '(allow: any)');
          content = content.replace(/(access: \(allow: any\) => \[[\s\S]*?\n {4}\])/g, '$1,');

          await fs.mkdir(authDir, { recursive: true });
          await fs.writeFile(path.join(authDir, 'resource.ts'), content, 'utf-8');

          // Contribute to backend.ts using new API
          this.backendGenerator.addNamespaceImport('auth', './auth/resource');
          this.backendGenerator.addDefineBackendEntry('auth', 'auth', 'auth');
          this.backendGenerator.addApplyEscapeHatchesCall('auth');
        },
      },
    ];
  }

  /** Builds the statements for the applyEscapeHatches function body. */
  private buildEscapeHatchStatements(options: AuthRenderOptions, hasIdentityProviders: boolean): ts.Statement[] {
    const statements: ts.Statement[] = [];

    // Password policy and username attributes overrides
    const userPoolOverrides = AuthRenderer.deriveUserPoolOverrides(options.userPool);
    if (Object.keys(userPoolOverrides).length > 0) {
      statements.push(...this.buildUserPoolOverrideStatements(userPoolOverrides));
    }

    // Identity pool: disable guest access
    if (options.identityPool?.AllowUnauthenticatedIdentities === false) {
      statements.push(TS.constFromBackend('cfnIdentityPool', 'auth', 'resources', 'cfnResources', 'cfnIdentityPool'));
      statements.push(TS.assignProp('cfnIdentityPool', 'allowUnauthenticatedIdentities', false));
    }

    // cfnUserPoolClient override for OAuth flows
    if (options.webClient?.AllowedOAuthFlows) {
      statements.push(TS.constFromBackend('cfnUserPoolClient', 'auth', 'resources', 'cfnResources', 'cfnUserPoolClient'));
      statements.push(TS.assignProp('cfnUserPoolClient', 'allowedOAuthFlows', options.webClient.AllowedOAuthFlows));
    }

    // User pool client overrides (native app client)
    if (options.userPoolClient) {
      statements.push(...this.buildUserPoolClientStatements(options.userPoolClient, hasIdentityProviders));
    }

    // Provider setup code
    if (hasIdentityProviders) {
      statements.push(...this.buildProviderSetupStatements());
    }

    return statements;
  }

  /** Builds additional imports needed for the applyEscapeHatches function. */
  private buildAdditionalImports(options: AuthRenderOptions, hasIdentityProviders: boolean): Record<string, Set<string>> {
    const imports: Record<string, Set<string>> = {};

    if (options.userPoolClient) {
      if (!imports['aws-cdk-lib']) imports['aws-cdk-lib'] = new Set();
      imports['aws-cdk-lib'].add('Duration');
    }

    if (hasIdentityProviders) {
      if (!imports['aws-cdk-lib/aws-cognito']) imports['aws-cdk-lib/aws-cognito'] = new Set();
      imports['aws-cdk-lib/aws-cognito'].add('OAuthScope');
      imports['aws-cdk-lib/aws-cognito'].add('UserPoolClientIdentityProvider');
    }

    return imports;
  }

  /** Builds cfnUserPool password policy and username attribute override statements. */
  private buildUserPoolOverrideStatements(overrides: Record<string, string | boolean | number | string[] | undefined>): ts.Statement[] {
    const statements: ts.Statement[] = [];
    const mappedPolicyType: Record<string, string> = {
      MinimumLength: 'minimumLength',
      RequireUppercase: 'requireUppercase',
      RequireLowercase: 'requireLowercase',
      RequireNumbers: 'requireNumbers',
      RequireSymbols: 'requireSymbols',
      PasswordHistorySize: 'passwordHistorySize',
      TemporaryPasswordValidityDays: 'temporaryPasswordValidityDays',
    };

    statements.push(TS.constFromBackend('cfnUserPool', 'auth', 'resources', 'cfnResources', 'cfnUserPool'));

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
        statements.push(TS.assignProp('cfnUserPool', overridePath, value));
      }
    }

    statements.push(TS.assignProp('cfnUserPool', 'policies', policies));
    return statements;
  }

  /** Builds userPool.addClient statements. */
  private buildUserPoolClientStatements(userPoolClient: UserPoolClientType, hasIdentityProviders: boolean): ts.Statement[] {
    const statements: ts.Statement[] = [];

    statements.push(TS.constFromBackend('userPool', 'auth', 'resources', 'userPool'));

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

    if (userPoolClient.AllowedOAuthFlows?.length) {
      clientProps.push(
        factory.createPropertyAssignment(
          factory.createIdentifier('// flows'),
          factory.createArrayLiteralExpression(userPoolClient.AllowedOAuthFlows.map((flow) => factory.createStringLiteral(flow, true))),
        ),
      );
    }

    const hasOAuth = (userPoolClient.AllowedOAuthFlows?.length ?? 0) > 0;
    clientProps.push(factory.createPropertyAssignment('disableOAuth', hasOAuth ? factory.createFalse() : factory.createTrue()));
    clientProps.push(
      factory.createPropertyAssignment('generateSecret', userPoolClient.ClientSecret ? factory.createTrue() : factory.createFalse()),
    );

    const addClientCall = factory.createCallExpression(
      factory.createPropertyAccessExpression(factory.createIdentifier('userPool'), factory.createIdentifier('addClient')),
      undefined,
      [factory.createStringLiteral('NativeAppClient'), factory.createObjectLiteralExpression(clientProps, true)],
    );

    if (hasIdentityProviders) {
      statements.push(
        factory.createVariableStatement(
          undefined,
          factory.createVariableDeclarationList(
            [factory.createVariableDeclaration(factory.createIdentifier('userPoolClient'), undefined, undefined, addClientCall)],
            ts.NodeFlags.Const,
          ),
        ),
      );
    } else {
      statements.push(factory.createExpressionStatement(addClientCall));
    }

    return statements;
  }

  /** Builds the providerSetupResult code and commented tryRemoveChild. */
  private buildProviderSetupStatements(): ts.Statement[] {
    const statements: ts.Statement[] = [];

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
    statements.push(providerSetupDecl);

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
    statements.push(forEachStatement);

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
    statements.push(commentedStatement);

    return statements;
  }
}
