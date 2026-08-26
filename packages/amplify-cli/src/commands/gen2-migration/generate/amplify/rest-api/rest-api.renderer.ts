import ts from 'typescript';
import { newLineIdentifier, TS } from '../../ts';

const factory = ts.factory;

/**
 * Complete definition of a REST API extracted from Gen1 cli-inputs.json and
 * amplify-meta.json.
 */
/* eslint-disable @typescript-eslint/no-explicit-any -- paths are untyped Gen1 cli-inputs.json */
export interface RestApiRenderOptions {
  readonly apiName: string;
  readonly exportedFunctionName: string;
  readonly paths: Record<string, any>;
  readonly gen1ApiId: string;
  readonly gen1RootResourceId: string;
  readonly adminQueriesFunctionNames?: readonly string[];
  readonly gen1UserPoolId?: string;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/**
 * Renders CDK constructs for REST API (API Gateway) resources.
 *
 * Produces TypeScript AST statements that go into backend.ts: stack
 * creation, RestApi + gateway responses, Lambda integrations, Gen1 API
 * references with IAM policies, resource trees with methods, and
 * per-path IAM policies for authenticated users and user groups.
 */
export class RestApiRenderer {
  private readonly hasAuth: boolean;

  public constructor(hasAuth: boolean) {
    this.hasAuth = hasAuth;
  }

  /**
   * Renders the complete resource.ts file for a REST API, including
   * imports, branchName, Backend type import, and the export function.
   */
  public render(restApi: RestApiRenderOptions): ts.NodeArray<ts.Node> {
    return factory.createNodeArray([
      ...this.renderImports(restApi),
      this.renderBackendTypeImport(),
      newLineIdentifier,
      TS.createBranchNameDeclaration(),
      newLineIdentifier,
      this.renderDefineApi(restApi),
    ] as ts.Statement[]);
  }

  private renderImports(restApi: RestApiRenderOptions): ts.ImportDeclaration[] {
    const apiGatewayImports = ['RestApi', 'LambdaIntegration', 'AuthorizationType', 'Cors', 'ResponseType'];
    if (this.isAdminQueriesApi(restApi)) {
      apiGatewayImports.push('CognitoUserPoolsAuthorizer');
    }

    return [
      TS.namedImport('aws-cdk-lib/aws-apigateway', ...apiGatewayImports),
      TS.namedImport('aws-cdk-lib/aws-iam', 'Policy', 'PolicyStatement'),
      TS.namedImport('aws-cdk-lib', 'Stack'),
    ];
  }

  private renderBackendTypeImport(): ts.ImportDeclaration {
    return TS.typeImport('../../backend', 'Backend');
  }

  private renderDefineApi(restApi: RestApiRenderOptions): ts.FunctionDeclaration {
    const statements = this.renderApi(restApi);

    return TS.exportedFunction(restApi.exportedFunctionName, statements);
  }

  /** Renders CDK statements for a single REST API in backend.ts. */
  private renderApi(restApi: RestApiRenderOptions): ts.Statement[] {
    const statements: ts.Statement[] = [];
    const sanitizedName = restApi.apiName.replace(/[^a-zA-Z0-9]/g, '');
    const apiVarName = `${sanitizedName}Api`;
    const gen1ApiVarName = `gen1${sanitizedName}Api`;
    const gen1PolicyVarName = `gen1${sanitizedName}Policy`;
    const adminQueriesMethodOptionsVarName = 'adminQueriesMethodOptions';

    statements.push(this.renderStack(restApi, 'stack'));
    statements.push(this.renderRestApiConstruct(restApi, 'stack', apiVarName));
    statements.push(...this.renderGatewayResponses(apiVarName));

    const integrations = this.renderLambdaIntegrations(restApi);
    statements.push(...integrations.statements);

    if (this.isAdminQueriesApi(restApi)) {
      statements.push(...this.renderAdminQueriesAuthorizer('stack', adminQueriesMethodOptionsVarName));
    }

    statements.push(this.renderGen1ApiReference(restApi, 'stack', gen1ApiVarName));
    statements.push(this.renderGen1Policy(restApi, 'stack', gen1ApiVarName, gen1PolicyVarName));

    if (this.hasPathAuth(restApi) && this.hasAuth) {
      statements.push(this.renderGen1PolicyAttachment(gen1PolicyVarName));
    }

    statements.push(
      ...this.renderPaths(
        restApi,
        apiVarName,
        integrations.map,
        this.isAdminQueriesApi(restApi) ? adminQueriesMethodOptionsVarName : undefined,
      ),
    );
    statements.push(...this.renderPathPolicies(restApi, apiVarName, 'stack', gen1ApiVarName));
    statements.push(...this.renderAdminQueriesLambdaPolicies(restApi, apiVarName));
    statements.push(this.renderOutput(apiVarName));

    return statements;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- raw cli-inputs path config
  private extractMethods(pathConfig: any): string[] {
    if (pathConfig.permissions?.auth?.length > 0) {
      return this.mapPermissionsToMethods(pathConfig.permissions.auth);
    }
    if (pathConfig.permissions?.groups) {
      const allPermissions = new Set<string>();
      for (const permissions of Object.values(pathConfig.permissions.groups) as string[][]) {
        for (const permission of permissions) {
          allPermissions.add(permission);
        }
      }
      return this.mapPermissionsToMethods(Array.from(allPermissions));
    }
    return ['GET'];
  }

  private mapPermissionsToMethods(permissions: readonly string[]): string[] {
    const methodMap: Record<string, string> = {
      read: 'GET',
      create: 'POST',
      update: 'PUT',
      delete: 'DELETE',
    };
    const methods = permissions.map((p) => methodMap[p]).filter((m): m is string => m !== undefined);
    return methods.length > 0 ? methods : ['GET'];
  }

  private renderStack(restApi: RestApiRenderOptions, stackVarName: string): ts.Statement {
    return factory.createVariableStatement(
      [],
      factory.createVariableDeclarationList(
        [
          factory.createVariableDeclaration(
            stackVarName,
            undefined,
            undefined,
            factory.createCallExpression(
              factory.createPropertyAccessExpression(factory.createIdentifier('backend'), factory.createIdentifier('createStack')),
              undefined,
              [factory.createStringLiteral(`rest-api-stack-${restApi.apiName}`)],
            ),
          ),
        ],
        ts.NodeFlags.Const,
      ),
    );
  }

  private renderRestApiConstruct(restApi: RestApiRenderOptions, stackVarName: string, apiVarName: string): ts.Statement {
    const restApiProps = [
      factory.createPropertyAssignment(
        'restApiName',
        factory.createTemplateExpression(factory.createTemplateHead(`${restApi.apiName}-`), [
          factory.createTemplateSpan(factory.createIdentifier('branchName'), factory.createTemplateTail('')),
        ]),
      ),
    ];
    if (this.isAdminQueriesApi(restApi)) {
      restApiProps.push(this.renderCorsPreflightOptions());
    }

    return factory.createVariableStatement(
      [],
      factory.createVariableDeclarationList(
        [
          factory.createVariableDeclaration(
            apiVarName,
            undefined,
            undefined,
            factory.createNewExpression(factory.createIdentifier('RestApi'), undefined, [
              factory.createIdentifier(stackVarName),
              factory.createStringLiteral('RestApi'),
              factory.createObjectLiteralExpression(restApiProps, true),
            ]),
          ),
        ],
        ts.NodeFlags.Const,
      ),
    );
  }

  private renderGatewayResponses(apiVarName: string): ts.Statement[] {
    return [
      this.renderGatewayResponse(apiVarName, 'Default4XX', 'DEFAULT_4XX'),
      this.renderGatewayResponse(apiVarName, 'Default5XX', 'DEFAULT_5XX'),
    ];
  }

  private renderGatewayResponse(apiVarName: string, name: string, responseType: string): ts.Statement {
    return factory.createExpressionStatement(
      factory.createCallExpression(
        factory.createPropertyAccessExpression(factory.createIdentifier(apiVarName), factory.createIdentifier('addGatewayResponse')),
        undefined,
        [
          factory.createStringLiteral(name),
          factory.createObjectLiteralExpression(
            [
              TS.enumProp('type', 'ResponseType', responseType),
              factory.createPropertyAssignment(
                'responseHeaders',
                factory.createObjectLiteralExpression(
                  [
                    factory.createPropertyAssignment(
                      factory.createStringLiteral('Access-Control-Allow-Origin'),
                      factory.createStringLiteral("'*'"),
                    ),
                    factory.createPropertyAssignment(
                      factory.createStringLiteral('Access-Control-Allow-Headers'),
                      factory.createStringLiteral("'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"),
                    ),
                    factory.createPropertyAssignment(
                      factory.createStringLiteral('Access-Control-Allow-Methods'),
                      factory.createStringLiteral("'DELETE,GET,HEAD,OPTIONS,PATCH,POST,PUT'"),
                    ),
                    factory.createPropertyAssignment(
                      factory.createStringLiteral('Access-Control-Expose-Headers'),
                      factory.createStringLiteral("'Date,X-Amzn-ErrorType'"),
                    ),
                  ],
                  true,
                ),
              ),
            ],
            true,
          ),
        ],
      ),
    );
  }

  private renderLambdaIntegrations(restApi: RestApiRenderOptions): {
    readonly statements: ts.Statement[];
    readonly map: ReadonlyMap<string, string>;
  } {
    const statements: ts.Statement[] = [];
    const map = new Map<string, string>();

    const uniqueFunctions = new Set<string>();
    for (const pathConfig of Object.values(restApi.paths)) {
      uniqueFunctions.add(pathConfig.lambdaFunction);
    }

    for (const funcName of uniqueFunctions) {
      const integrationVarName = `${funcName}Integration`;
      map.set(funcName, integrationVarName);

      statements.push(
        factory.createVariableStatement(
          [],
          factory.createVariableDeclarationList(
            [
              factory.createVariableDeclaration(
                integrationVarName,
                undefined,
                undefined,
                factory.createNewExpression(factory.createIdentifier('LambdaIntegration'), undefined, [
                  factory.createPropertyAccessExpression(
                    factory.createPropertyAccessExpression(
                      factory.createPropertyAccessExpression(factory.createIdentifier('backend'), factory.createIdentifier(funcName)),
                      factory.createIdentifier('resources'),
                    ),
                    factory.createIdentifier('lambda'),
                  ),
                ]),
              ),
            ],
            ts.NodeFlags.Const,
          ),
        ),
      );
    }

    return { statements, map };
  }

  private renderAdminQueriesAuthorizer(stackVarName: string, methodOptionsVarName: string): ts.Statement[] {
    return [
      TS.declareConst(
        'adminQueriesCognitoAuthorizer',
        factory.createNewExpression(factory.createIdentifier('CognitoUserPoolsAuthorizer'), undefined, [
          factory.createIdentifier(stackVarName),
          factory.createStringLiteral('CognitoAuthorizer'),
          factory.createObjectLiteralExpression(
            [
              factory.createPropertyAssignment(
                'cognitoUserPools',
                factory.createArrayLiteralExpression([TS.propAccess('backend', 'auth', 'resources', 'userPool')]),
              ),
              factory.createPropertyAssignment('identitySource', factory.createStringLiteral('method.request.header.Authorization')),
            ],
            true,
          ),
        ]),
      ),
      TS.declareConst(
        methodOptionsVarName,
        factory.createObjectLiteralExpression(
          [
            TS.enumProp('authorizationType', 'AuthorizationType', 'COGNITO'),
            factory.createPropertyAssignment('authorizer', factory.createIdentifier('adminQueriesCognitoAuthorizer')),
            factory.createPropertyAssignment(
              'authorizationScopes',
              factory.createArrayLiteralExpression([factory.createStringLiteral('aws.cognito.signin.user.admin')]),
            ),
          ],
          true,
        ),
      ),
    ];
  }

  private renderGen1ApiReference(restApi: RestApiRenderOptions, stackVarName: string, gen1ApiVarName: string): ts.Statement {
    return factory.createVariableStatement(
      [],
      factory.createVariableDeclarationList(
        [
          factory.createVariableDeclaration(
            gen1ApiVarName,
            undefined,
            undefined,
            factory.createCallExpression(
              factory.createPropertyAccessExpression(
                factory.createIdentifier('RestApi'),
                factory.createIdentifier('fromRestApiAttributes'),
              ),
              undefined,
              [
                factory.createIdentifier(stackVarName),
                factory.createStringLiteral(`Gen1${restApi.apiName}Api`),
                factory.createObjectLiteralExpression(
                  [
                    factory.createPropertyAssignment('restApiId', factory.createStringLiteral(restApi.gen1ApiId)),
                    factory.createPropertyAssignment('rootResourceId', factory.createStringLiteral(restApi.gen1RootResourceId)),
                  ],
                  true,
                ),
              ],
            ),
          ),
        ],
        ts.NodeFlags.Const,
      ),
    );
  }

  private renderGen1Policy(
    restApi: RestApiRenderOptions,
    stackVarName: string,
    gen1ApiVarName: string,
    gen1PolicyVarName: string,
  ): ts.Statement {
    return factory.createVariableStatement(
      [],
      factory.createVariableDeclarationList(
        [
          factory.createVariableDeclaration(
            gen1PolicyVarName,
            undefined,
            undefined,
            factory.createNewExpression(factory.createIdentifier('Policy'), undefined, [
              factory.createIdentifier(stackVarName),
              factory.createStringLiteral(`Gen1${restApi.apiName}Policy`),
              factory.createObjectLiteralExpression(
                [
                  factory.createPropertyAssignment(
                    'statements',
                    factory.createArrayLiteralExpression([
                      factory.createNewExpression(factory.createIdentifier('PolicyStatement'), undefined, [
                        factory.createObjectLiteralExpression(
                          [
                            factory.createPropertyAssignment(
                              'actions',
                              factory.createArrayLiteralExpression([factory.createStringLiteral('execute-api:Invoke')]),
                            ),
                            factory.createPropertyAssignment(
                              'resources',
                              factory.createArrayLiteralExpression([
                                ...Object.entries(restApi.paths).flatMap(([, pathConfig]) =>
                                  this.extractMethods(pathConfig).map((method) =>
                                    factory.createTemplateExpression(factory.createTemplateHead(''), [
                                      factory.createTemplateSpan(
                                        factory.createCallExpression(
                                          factory.createPropertyAccessExpression(
                                            factory.createIdentifier(gen1ApiVarName),
                                            factory.createIdentifier('arnForExecuteApi'),
                                          ),
                                          undefined,
                                          [factory.createStringLiteral(method), factory.createStringLiteral('/*')],
                                        ),
                                        factory.createTemplateTail(''),
                                      ),
                                    ]),
                                  ),
                                ),
                              ]),
                            ),
                          ],
                          true,
                        ),
                      ]),
                    ]),
                  ),
                ],
                true,
              ),
            ]),
          ),
        ],
        ts.NodeFlags.Const,
      ),
    );
  }

  private renderGen1PolicyAttachment(gen1PolicyVarName: string): ts.Statement {
    return factory.createExpressionStatement(
      factory.createCallExpression(
        factory.createPropertyAccessExpression(
          factory.createPropertyAccessExpression(
            factory.createIdentifier('backend.auth.resources'),
            factory.createIdentifier('authenticatedUserIamRole'),
          ),
          factory.createIdentifier('attachInlinePolicy'),
        ),
        undefined,
        [factory.createIdentifier(gen1PolicyVarName)],
      ),
    );
  }

  private renderPaths(
    restApi: RestApiRenderOptions,
    apiVarName: string,
    integrations: ReadonlyMap<string, string>,
    methodOptionsVarName?: string,
  ): ts.Statement[] {
    const statements: ts.Statement[] = [];

    for (const [pathName, pathConfig] of Object.entries(restApi.paths)) {
      const pathSegments = pathName.split('/').filter((segment) => segment && segment !== '{proxy+}');

      const resourceName = pathSegments.join('').replace(/[^a-zA-Z0-9]/g, '') || 'root';

      let resourceExpression: ts.Expression = factory.createPropertyAccessExpression(
        factory.createIdentifier(apiVarName),
        factory.createIdentifier('root'),
      );

      for (let i = 0; i < pathSegments.length; i++) {
        const isLastSegment = i === pathSegments.length - 1;
        const resourceArgs: ts.Expression[] = [factory.createStringLiteral(pathSegments[i])];

        if (isLastSegment) {
          const resourceOptions: ts.PropertyAssignment[] = [];

          if (pathConfig.permissions?.setting === 'private') {
            resourceOptions.push(
              factory.createPropertyAssignment(
                'defaultMethodOptions',
                factory.createObjectLiteralExpression([TS.enumProp('authorizationType', 'AuthorizationType', 'IAM')], true),
              ),
            );
          }

          resourceOptions.push(this.renderCorsPreflightOptions());

          resourceArgs.push(factory.createObjectLiteralExpression(resourceOptions, true));
        }

        resourceExpression = factory.createCallExpression(
          factory.createPropertyAccessExpression(resourceExpression, factory.createIdentifier('addResource')),
          undefined,
          resourceArgs,
        );
      }

      statements.push(
        factory.createVariableStatement(
          [],
          factory.createVariableDeclarationList(
            [factory.createVariableDeclaration(resourceName, undefined, undefined, resourceExpression)],
            ts.NodeFlags.Const,
          ),
        ),
      );

      const integrationVar = integrations.get(pathConfig.lambdaFunction) ?? `${pathConfig.lambdaFunction}Integration`;

      statements.push(
        factory.createExpressionStatement(
          factory.createCallExpression(
            factory.createPropertyAccessExpression(factory.createIdentifier(resourceName), factory.createIdentifier('addMethod')),
            undefined,
            [
              factory.createStringLiteral('ANY'),
              factory.createIdentifier(integrationVar),
              ...(methodOptionsVarName ? [factory.createIdentifier(methodOptionsVarName)] : []),
            ],
          ),
        ),
      );

      const addProxyCall = factory.createCallExpression(
        factory.createPropertyAccessExpression(factory.createIdentifier(resourceName), factory.createIdentifier('addProxy')),
        undefined,
        [
          factory.createObjectLiteralExpression(
            [
              factory.createPropertyAssignment('anyMethod', methodOptionsVarName ? factory.createFalse() : factory.createTrue()),
              factory.createPropertyAssignment('defaultIntegration', factory.createIdentifier(integrationVar)),
            ],
            true,
          ),
        ],
      );

      if (methodOptionsVarName) {
        const proxyVarName = `${resourceName}Proxy`;
        statements.push(TS.declareConst(proxyVarName, addProxyCall));
        statements.push(
          factory.createExpressionStatement(
            factory.createCallExpression(
              factory.createPropertyAccessExpression(factory.createIdentifier(proxyVarName), factory.createIdentifier('addMethod')),
              undefined,
              [
                factory.createStringLiteral('ANY'),
                factory.createIdentifier(integrationVar),
                factory.createIdentifier(methodOptionsVarName),
              ],
            ),
          ),
        );
      } else {
        statements.push(factory.createExpressionStatement(addProxyCall));
      }
    }

    return statements;
  }

  private renderAdminQueriesLambdaPolicies(restApi: RestApiRenderOptions, apiVarName: string): ts.Statement[] {
    if (!this.isAdminQueriesApi(restApi)) {
      return [];
    }

    const functionNames = restApi.adminQueriesFunctionNames ?? [];

    const actions = [
      'cognito-idp:AdminAddUserToGroup',
      'cognito-idp:AdminConfirmSignUp',
      'cognito-idp:AdminDisableUser',
      'cognito-idp:AdminEnableUser',
      'cognito-idp:AdminGetUser',
      'cognito-idp:AdminListGroupsForUser',
      'cognito-idp:AdminRemoveUserFromGroup',
      'cognito-idp:AdminUserGlobalSignOut',
      'cognito-idp:ListGroups',
      'cognito-idp:ListUsers',
      'cognito-idp:ListUsersInGroup',
    ];

    return functionNames.map((functionName) => {
      const resources = [
        TS.propAccess('backend', 'auth', 'resources', 'userPool', 'userPoolArn') as ts.Expression,
        ...(restApi.gen1UserPoolId ? [this.renderGen1UserPoolArn(apiVarName, restApi.gen1UserPoolId)] : []),
      ];

      return factory.createExpressionStatement(
        factory.createCallExpression(
          factory.createPropertyAccessExpression(
            TS.propAccess('backend', functionName, 'resources', 'lambda') as ts.Expression,
            factory.createIdentifier('addToRolePolicy'),
          ),
          undefined,
          [
            factory.createNewExpression(factory.createIdentifier('PolicyStatement'), undefined, [
              factory.createObjectLiteralExpression(
                [
                  factory.createPropertyAssignment(
                    'actions',
                    factory.createArrayLiteralExpression(actions.map((action) => factory.createStringLiteral(action))),
                  ),
                  factory.createPropertyAssignment('resources', factory.createArrayLiteralExpression(resources)),
                ],
                true,
              ),
            ]),
          ],
        ),
      );
    });
  }

  private renderGen1UserPoolArn(apiVarName: string, gen1UserPoolId: string): ts.CallExpression {
    const stackOfApi = factory.createCallExpression(
      factory.createPropertyAccessExpression(factory.createIdentifier('Stack'), factory.createIdentifier('of')),
      undefined,
      [factory.createIdentifier(apiVarName)],
    );

    return factory.createCallExpression(
      factory.createPropertyAccessExpression(stackOfApi, factory.createIdentifier('formatArn')),
      undefined,
      [
        factory.createObjectLiteralExpression(
          [
            factory.createPropertyAssignment('service', factory.createStringLiteral('cognito-idp')),
            factory.createPropertyAssignment('resource', factory.createStringLiteral('userpool')),
            factory.createPropertyAssignment('resourceName', factory.createStringLiteral(gen1UserPoolId)),
          ],
          true,
        ),
      ],
    );
  }

  private renderCorsPreflightOptions(): ts.PropertyAssignment {
    return factory.createPropertyAssignment(
      'defaultCorsPreflightOptions',
      factory.createObjectLiteralExpression(
        [
          TS.enumProp('allowOrigins', 'Cors', 'ALL_ORIGINS'),
          TS.enumProp('allowMethods', 'Cors', 'ALL_METHODS'),
          factory.createPropertyAssignment(
            'allowHeaders',
            factory.createArrayLiteralExpression([
              factory.createStringLiteral('Content-Type'),
              factory.createStringLiteral('X-Amz-Date'),
              factory.createStringLiteral('Authorization'),
              factory.createStringLiteral('X-Api-Key'),
              factory.createStringLiteral('X-Amz-Security-Token'),
              factory.createStringLiteral('X-Amz-User-Agent'),
            ]),
          ),
          factory.createPropertyAssignment('statusCode', factory.createNumericLiteral('200')),
        ],
        true,
      ),
    );
  }

  private renderPathPolicies(
    restApi: RestApiRenderOptions,
    apiVarName: string,
    stackVarName: string,
    gen1ApiVarName: string,
  ): ts.Statement[] {
    const statements: ts.Statement[] = [];

    for (const [pathName, pathConfig] of Object.entries(restApi.paths)) {
      if (pathConfig.permissions?.auth?.length > 0) {
        statements.push(...this.renderAuthPathPolicy(pathName, pathConfig, apiVarName, stackVarName));
      }

      if (pathConfig.permissions?.groups) {
        for (const groupName of Object.keys(pathConfig.permissions.groups)) {
          statements.push(...this.renderGroupPathPolicy(pathName, pathConfig, apiVarName, stackVarName, groupName, gen1ApiVarName));
        }
      }
    }

    return statements;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- raw cli-inputs path config
  private renderAuthPathPolicy(pathName: string, pathConfig: any, apiVarName: string, stackVarName: string): ts.Statement[] {
    const comment = factory.createNotEmittedStatement(factory.createStringLiteral(''));
    ts.addSyntheticLeadingComment(comment, ts.SyntaxKind.SingleLineCommentTrivia, ` ${pathName} - all authenticated users`, true);

    const policyName = `${pathName.replace(/[^a-zA-Z0-9]/g, '')}AuthPolicy`;

    const attachCall = factory.createExpressionStatement(
      factory.createCallExpression(
        factory.createPropertyAccessExpression(
          factory.createPropertyAccessExpression(
            factory.createIdentifier('backend.auth.resources'),
            factory.createIdentifier('authenticatedUserIamRole'),
          ),
          factory.createIdentifier('attachInlinePolicy'),
        ),
        undefined,
        [
          factory.createNewExpression(factory.createIdentifier('Policy'), undefined, [
            factory.createIdentifier(stackVarName),
            factory.createStringLiteral(policyName),
            factory.createObjectLiteralExpression(
              [
                factory.createPropertyAssignment(
                  'statements',
                  factory.createArrayLiteralExpression([
                    factory.createNewExpression(factory.createIdentifier('PolicyStatement'), undefined, [
                      factory.createObjectLiteralExpression(
                        [
                          factory.createPropertyAssignment(
                            'actions',
                            factory.createArrayLiteralExpression([factory.createStringLiteral('execute-api:Invoke')]),
                          ),
                          factory.createPropertyAssignment(
                            'resources',
                            factory.createArrayLiteralExpression([
                              ...this.extractMethods(pathConfig).flatMap((method) => [
                                factory.createCallExpression(
                                  factory.createPropertyAccessExpression(
                                    factory.createIdentifier(apiVarName),
                                    factory.createIdentifier('arnForExecuteApi'),
                                  ),
                                  undefined,
                                  [factory.createStringLiteral(method), factory.createStringLiteral(pathName)],
                                ),
                                factory.createCallExpression(
                                  factory.createPropertyAccessExpression(
                                    factory.createIdentifier(apiVarName),
                                    factory.createIdentifier('arnForExecuteApi'),
                                  ),
                                  undefined,
                                  [factory.createStringLiteral(method), factory.createStringLiteral(`${pathName}/*`)],
                                ),
                              ]),
                            ]),
                          ),
                        ],
                        true,
                      ),
                    ]),
                  ]),
                ),
              ],
              true,
            ),
          ]),
        ],
      ),
    );

    return [comment as unknown as ts.Statement, attachCall];
  }

  /* eslint-disable @typescript-eslint/no-explicit-any -- raw cli-inputs path config */
  private renderGroupPathPolicy(
    pathName: string,
    pathConfig: any,
    apiVarName: string,
    stackVarName: string,
    groupName: string,
    gen1ApiVarName: string,
  ): ts.Statement[] {
    /* eslint-enable @typescript-eslint/no-explicit-any */
    const comment = factory.createNotEmittedStatement(factory.createStringLiteral(''));
    ts.addSyntheticLeadingComment(comment, ts.SyntaxKind.SingleLineCommentTrivia, ` ${pathName} - ${groupName} group only`, true);

    const policyName = `${pathName.replace(/[^a-zA-Z0-9]/g, '')}${groupName}Policy`;

    const attachCall = factory.createExpressionStatement(
      factory.createCallExpression(
        factory.createPropertyAccessExpression(
          factory.createPropertyAccessExpression(
            factory.createElementAccessExpression(
              factory.createPropertyAccessExpression(
                factory.createIdentifier('backend.auth.resources'),
                factory.createIdentifier('groups'),
              ),
              factory.createStringLiteral(groupName),
            ),
            factory.createIdentifier('role'),
          ),
          factory.createIdentifier('attachInlinePolicy'),
        ),
        undefined,
        [
          factory.createNewExpression(factory.createIdentifier('Policy'), undefined, [
            factory.createIdentifier(stackVarName),
            factory.createStringLiteral(policyName),
            factory.createObjectLiteralExpression(
              [
                factory.createPropertyAssignment(
                  'statements',
                  factory.createArrayLiteralExpression([
                    factory.createNewExpression(factory.createIdentifier('PolicyStatement'), undefined, [
                      factory.createObjectLiteralExpression(
                        [
                          factory.createPropertyAssignment(
                            'actions',
                            factory.createArrayLiteralExpression([factory.createStringLiteral('execute-api:Invoke')]),
                          ),
                          factory.createPropertyAssignment(
                            'resources',
                            factory.createArrayLiteralExpression([
                              ...this.extractMethods(pathConfig).flatMap((method) => [
                                factory.createCallExpression(
                                  factory.createPropertyAccessExpression(
                                    factory.createIdentifier(apiVarName),
                                    factory.createIdentifier('arnForExecuteApi'),
                                  ),
                                  undefined,
                                  [factory.createStringLiteral(method), factory.createStringLiteral(pathName)],
                                ),
                                factory.createCallExpression(
                                  factory.createPropertyAccessExpression(
                                    factory.createIdentifier(apiVarName),
                                    factory.createIdentifier('arnForExecuteApi'),
                                  ),
                                  undefined,
                                  [factory.createStringLiteral(method), factory.createStringLiteral(`${pathName}/*`)],
                                ),
                              ]),
                            ]),
                          ),
                        ],
                        true,
                      ),
                    ]),
                  ]),
                ),
              ],
              true,
            ),
          ]),
        ],
      ),
    );

    const pathPart = pathName.replace(/[^a-zA-Z0-9]/g, '');
    const capitalizedPathPart = pathPart.charAt(0).toUpperCase() + pathPart.slice(1);
    const gen1PolicyName = `gen1${capitalizedPathPart}${groupName}Policy`;

    return [
      comment as unknown as ts.Statement,
      attachCall,
      this.renderGen1GroupPathPolicy(pathName, pathConfig, gen1ApiVarName, stackVarName, groupName, gen1PolicyName),
    ];
  }

  /** Renders a policy attaching gen1 API path permissions to a Cognito group role. */
  private renderGen1GroupPathPolicy(
    pathName: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- raw cli-inputs path config
    pathConfig: any,
    gen1ApiVarName: string,
    stackVarName: string,
    groupName: string,
    policyName: string,
  ): ts.Statement {
    return factory.createExpressionStatement(
      factory.createCallExpression(
        factory.createPropertyAccessExpression(
          factory.createPropertyAccessExpression(
            factory.createElementAccessExpression(
              factory.createPropertyAccessExpression(
                factory.createIdentifier('backend.auth.resources'),
                factory.createIdentifier('groups'),
              ),
              factory.createStringLiteral(groupName),
            ),
            factory.createIdentifier('role'),
          ),
          factory.createIdentifier('attachInlinePolicy'),
        ),
        undefined,
        [
          factory.createNewExpression(factory.createIdentifier('Policy'), undefined, [
            factory.createIdentifier(stackVarName),
            factory.createStringLiteral(policyName),
            factory.createObjectLiteralExpression(
              [
                factory.createPropertyAssignment(
                  'statements',
                  factory.createArrayLiteralExpression([
                    factory.createNewExpression(factory.createIdentifier('PolicyStatement'), undefined, [
                      factory.createObjectLiteralExpression(
                        [
                          factory.createPropertyAssignment(
                            'actions',
                            factory.createArrayLiteralExpression([factory.createStringLiteral('execute-api:Invoke')]),
                          ),
                          factory.createPropertyAssignment(
                            'resources',
                            factory.createArrayLiteralExpression([
                              ...this.extractMethods(pathConfig).flatMap((method) => [
                                factory.createCallExpression(
                                  factory.createPropertyAccessExpression(
                                    factory.createIdentifier(gen1ApiVarName),
                                    factory.createIdentifier('arnForExecuteApi'),
                                  ),
                                  undefined,
                                  [factory.createStringLiteral(method), factory.createStringLiteral(pathName)],
                                ),
                                factory.createCallExpression(
                                  factory.createPropertyAccessExpression(
                                    factory.createIdentifier(gen1ApiVarName),
                                    factory.createIdentifier('arnForExecuteApi'),
                                  ),
                                  undefined,
                                  [factory.createStringLiteral(method), factory.createStringLiteral(`${pathName}/*`)],
                                ),
                              ]),
                            ]),
                          ),
                        ],
                        true,
                      ),
                    ]),
                  ]),
                ),
              ],
              true,
            ),
          ]),
        ],
      ),
    );
  }

  private renderOutput(apiVarName: string): ts.Statement {
    return factory.createExpressionStatement(
      factory.createCallExpression(
        factory.createPropertyAccessExpression(factory.createIdentifier('backend'), factory.createIdentifier('addOutput')),
        undefined,
        [
          factory.createObjectLiteralExpression(
            [
              factory.createPropertyAssignment(
                'custom',
                factory.createObjectLiteralExpression(
                  [
                    factory.createPropertyAssignment(
                      'API',
                      factory.createObjectLiteralExpression(
                        [
                          factory.createPropertyAssignment(
                            factory.createComputedPropertyName(
                              factory.createPropertyAccessExpression(
                                factory.createIdentifier(apiVarName),
                                factory.createIdentifier('restApiName'),
                              ),
                            ),
                            factory.createObjectLiteralExpression(
                              [
                                factory.createPropertyAssignment(
                                  'endpoint',
                                  factory.createCallExpression(
                                    factory.createPropertyAccessExpression(
                                      factory.createPropertyAccessExpression(
                                        factory.createIdentifier(apiVarName),
                                        factory.createIdentifier('url'),
                                      ),
                                      factory.createIdentifier('slice'),
                                    ),
                                    undefined,
                                    [
                                      factory.createNumericLiteral('0'),
                                      factory.createPrefixUnaryExpression(ts.SyntaxKind.MinusToken, factory.createNumericLiteral('1')),
                                    ],
                                  ),
                                ),
                                factory.createPropertyAssignment(
                                  'region',
                                  factory.createPropertyAccessExpression(
                                    factory.createCallExpression(
                                      factory.createPropertyAccessExpression(
                                        factory.createIdentifier('Stack'),
                                        factory.createIdentifier('of'),
                                      ),
                                      undefined,
                                      [factory.createIdentifier(apiVarName)],
                                    ),
                                    factory.createIdentifier('region'),
                                  ),
                                ),
                                factory.createPropertyAssignment(
                                  'apiName',
                                  factory.createPropertyAccessExpression(
                                    factory.createIdentifier(apiVarName),
                                    factory.createIdentifier('restApiName'),
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
                  true,
                ),
              ),
            ],
            true,
          ),
        ],
      ),
    );
  }

  private hasPathAuth(restApi: RestApiRenderOptions): boolean {
    return Object.values(restApi.paths).some(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- raw cli-inputs path config
      (p: any) => p.permissions?.setting === 'private' || p.permissions?.setting === 'protected',
    );
  }

  private isAdminQueriesApi(restApi: RestApiRenderOptions): boolean {
    return this.hasAuth && (restApi.adminQueriesFunctionNames?.length ?? 0) > 0;
  }
}
