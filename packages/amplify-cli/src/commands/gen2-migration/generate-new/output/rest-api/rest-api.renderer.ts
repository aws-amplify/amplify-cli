import ts from 'typescript';
import { RestApiDefinition, RestApiPath } from '../../input/gen1-app';

const factory = ts.factory;

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
  private readonly functionNames: ReadonlySet<string>;

  public constructor(hasAuth: boolean, functionNames: ReadonlySet<string>) {
    this.hasAuth = hasAuth;
    this.functionNames = functionNames;
  }

  /**
   * Renders all REST API CDK statements for backend.ts.
   */
  public render(restApis: readonly RestApiDefinition[]): ts.Statement[] {
    const statements: ts.Statement[] = [];

    for (const restApi of restApis) {
      const stackVarName = `${restApi.apiName}Stack`;
      const apiVarName = `${restApi.apiName}Api`;
      const gen1ApiVarName = `gen1${restApi.apiName}Api`;
      const gen1PolicyVarName = `gen1${restApi.apiName}Policy`;

      statements.push(this.renderStack(restApi, stackVarName));
      statements.push(this.renderApi(restApi, stackVarName, apiVarName));
      statements.push(...this.renderGatewayResponses(apiVarName));

      const integrations = this.renderLambdaIntegrations(restApi);
      statements.push(...integrations.statements);

      statements.push(this.renderGen1ApiReference(restApi, stackVarName, gen1ApiVarName));
      statements.push(this.renderGen1Policy(restApi, stackVarName, gen1ApiVarName, gen1PolicyVarName));

      if (restApi.authType && this.hasAuth) {
        statements.push(this.renderGen1PolicyAttachment(gen1PolicyVarName));
      }

      statements.push(...this.renderPaths(restApi, apiVarName, integrations.map));
      statements.push(...this.renderPathPolicies(restApi, apiVarName, stackVarName));
      statements.push(this.renderOutput(apiVarName));
    }

    return statements;
  }

  private renderStack(restApi: RestApiDefinition, stackVarName: string): ts.Statement {
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

  private renderApi(restApi: RestApiDefinition, stackVarName: string, apiVarName: string): ts.Statement {
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
              factory.createObjectLiteralExpression(
                [
                  factory.createPropertyAssignment(
                    'restApiName',
                    factory.createTemplateExpression(factory.createTemplateHead(`${restApi.apiName}-`), [
                      factory.createTemplateSpan(factory.createIdentifier('branchName'), factory.createTemplateTail('')),
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
              factory.createPropertyAssignment(
                'type',
                factory.createPropertyAccessExpression(factory.createIdentifier('ResponseType'), factory.createIdentifier(responseType)),
              ),
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

  private renderLambdaIntegrations(restApi: RestApiDefinition): {
    readonly statements: ts.Statement[];
    readonly map: ReadonlyMap<string, string>;
  } {
    const statements: ts.Statement[] = [];
    const map = new Map<string, string>();

    if (!restApi.uniqueFunctions) {
      return { statements, map };
    }

    for (const funcName of restApi.uniqueFunctions) {
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

  private renderGen1ApiReference(restApi: RestApiDefinition, stackVarName: string, gen1ApiVarName: string): ts.Statement {
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
                    factory.createPropertyAssignment('restApiId', factory.createStringLiteral(`<gen1-${restApi.apiName}-api-id>`)),
                    factory.createPropertyAssignment(
                      'rootResourceId',
                      factory.createStringLiteral(`<gen1-${restApi.apiName}-root-resource-id>`),
                    ),
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
    restApi: RestApiDefinition,
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
                                ...restApi.paths.flatMap((apiPath) =>
                                  apiPath.methods.map((method) =>
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

  private renderPaths(restApi: RestApiDefinition, apiVarName: string, integrations: ReadonlyMap<string, string>): ts.Statement[] {
    const statements: ts.Statement[] = [];

    for (const apiPath of restApi.paths) {
      const pathSegments = apiPath.path.split('/').filter((segment) => segment && segment !== '{proxy+}');

      let resourceName = pathSegments.join('') || 'root';
      if (this.functionNames.has(resourceName)) {
        resourceName = `${resourceName}Resource`;
      }

      let resourceExpression: ts.Expression = factory.createPropertyAccessExpression(
        factory.createIdentifier(apiVarName),
        factory.createIdentifier('root'),
      );

      for (let i = 0; i < pathSegments.length; i++) {
        const isLastSegment = i === pathSegments.length - 1;
        const resourceArgs: ts.Expression[] = [factory.createStringLiteral(pathSegments[i])];

        if (isLastSegment) {
          const resourceOptions: ts.PropertyAssignment[] = [];

          if (apiPath.authType === 'private') {
            resourceOptions.push(
              factory.createPropertyAssignment(
                'defaultMethodOptions',
                factory.createObjectLiteralExpression(
                  [
                    factory.createPropertyAssignment(
                      'authorizationType',
                      factory.createPropertyAccessExpression(
                        factory.createIdentifier('AuthorizationType'),
                        factory.createIdentifier('IAM'),
                      ),
                    ),
                  ],
                  true,
                ),
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

      const integrationVar = integrations.get(apiPath.lambdaFunction ?? '') ?? `${apiPath.lambdaFunction}Integration`;

      statements.push(
        factory.createExpressionStatement(
          factory.createCallExpression(
            factory.createPropertyAccessExpression(factory.createIdentifier(resourceName), factory.createIdentifier('addMethod')),
            undefined,
            [factory.createStringLiteral('ANY'), factory.createIdentifier(integrationVar)],
          ),
        ),
      );

      statements.push(
        factory.createExpressionStatement(
          factory.createCallExpression(
            factory.createPropertyAccessExpression(factory.createIdentifier(resourceName), factory.createIdentifier('addProxy')),
            undefined,
            [
              factory.createObjectLiteralExpression(
                [
                  factory.createPropertyAssignment('anyMethod', factory.createTrue()),
                  factory.createPropertyAssignment('defaultIntegration', factory.createIdentifier(integrationVar)),
                ],
                true,
              ),
            ],
          ),
        ),
      );
    }

    return statements;
  }

  private renderCorsPreflightOptions(): ts.PropertyAssignment {
    return factory.createPropertyAssignment(
      'defaultCorsPreflightOptions',
      factory.createObjectLiteralExpression(
        [
          factory.createPropertyAssignment(
            'allowOrigins',
            factory.createPropertyAccessExpression(factory.createIdentifier('Cors'), factory.createIdentifier('ALL_ORIGINS')),
          ),
          factory.createPropertyAssignment(
            'allowMethods',
            factory.createPropertyAccessExpression(factory.createIdentifier('Cors'), factory.createIdentifier('ALL_METHODS')),
          ),
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

  private renderPathPolicies(restApi: RestApiDefinition, apiVarName: string, stackVarName: string): ts.Statement[] {
    const statements: ts.Statement[] = [];

    for (const apiPath of restApi.paths) {
      if (apiPath.permissions?.hasAuth) {
        statements.push(...this.renderAuthPathPolicy(apiPath, apiVarName, stackVarName));
      }

      if (apiPath.permissions?.groups) {
        for (const groupName of Object.keys(apiPath.permissions.groups)) {
          statements.push(...this.renderGroupPathPolicy(apiPath, apiVarName, stackVarName, groupName));
        }
      }
    }

    return statements;
  }

  private renderAuthPathPolicy(apiPath: RestApiPath, apiVarName: string, stackVarName: string): ts.Statement[] {
    const comment = factory.createNotEmittedStatement(factory.createStringLiteral(''));
    ts.addSyntheticLeadingComment(comment, ts.SyntaxKind.SingleLineCommentTrivia, ` ${apiPath.path} - all authenticated users`, true);

    const policyName = `${apiPath.path.replace(/[^a-zA-Z0-9]/g, '')}AuthPolicy`;

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
                              ...apiPath.methods.flatMap((method) => [
                                factory.createCallExpression(
                                  factory.createPropertyAccessExpression(
                                    factory.createIdentifier(apiVarName),
                                    factory.createIdentifier('arnForExecuteApi'),
                                  ),
                                  undefined,
                                  [factory.createStringLiteral(method), factory.createStringLiteral(apiPath.path)],
                                ),
                                factory.createCallExpression(
                                  factory.createPropertyAccessExpression(
                                    factory.createIdentifier(apiVarName),
                                    factory.createIdentifier('arnForExecuteApi'),
                                  ),
                                  undefined,
                                  [factory.createStringLiteral(method), factory.createStringLiteral(`${apiPath.path}/*`)],
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

  private renderGroupPathPolicy(apiPath: RestApiPath, apiVarName: string, stackVarName: string, groupName: string): ts.Statement[] {
    const comment = factory.createNotEmittedStatement(factory.createStringLiteral(''));
    ts.addSyntheticLeadingComment(comment, ts.SyntaxKind.SingleLineCommentTrivia, ` ${apiPath.path} - ${groupName} group only`, true);

    const policyName = `${apiPath.path.replace(/[^a-zA-Z0-9]/g, '')}${groupName}Policy`;

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
                              ...apiPath.methods.flatMap((method) => [
                                factory.createCallExpression(
                                  factory.createPropertyAccessExpression(
                                    factory.createIdentifier(apiVarName),
                                    factory.createIdentifier('arnForExecuteApi'),
                                  ),
                                  undefined,
                                  [factory.createStringLiteral(method), factory.createStringLiteral(apiPath.path)],
                                ),
                                factory.createCallExpression(
                                  factory.createPropertyAccessExpression(
                                    factory.createIdentifier(apiVarName),
                                    factory.createIdentifier('arnForExecuteApi'),
                                  ),
                                  undefined,
                                  [factory.createStringLiteral(method), factory.createStringLiteral(`${apiPath.path}/*`)],
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
}
