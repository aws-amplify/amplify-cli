import ts from 'typescript';
import { newLineIdentifier, TS } from '../../_infra/ts';

const factory = ts.factory;

/**
 * Options for rendering an analytics resource.ts file.
 */
export interface RenderDefineAnalyticsOptions {
  /**
   * The class name of the generated construct (e.g., 'analyticstodoprojectKinesis').
   */
  readonly constructClassName: string;

  /**
   * The file name of the generated construct without extension (e.g., 'todoprojectKinesis-construct').
   */
  readonly constructFileName: string;

  /**
   * The resource name used for construct ID and props (e.g., 'todoprojectKinesis').
   */
  readonly resourceName: string;

  /**
   * The number of shards for the Kinesis stream.
   */
  readonly shardCount: number;

  /**
   * The actual deployed Kinesis stream name from Gen1.
   */
  readonly streamName: string;
}

/**
 * Renders a defineAnalytics() resource.ts file from Gen1 Kinesis configuration.
 * Pure — no AWS calls, no side effects.
 */
export class AnalyticsRenderer {
  /**
   * Produces the complete TypeScript AST for analytics/resource.ts.
   */
  public render(opts: RenderDefineAnalyticsOptions): ts.NodeArray<ts.Node> {
    const imports = this.createImports(opts.constructClassName, opts.constructFileName);
    const branchNameConst = TS.createBranchNameDeclaration();
    const exportNodes = this.createExportStatement(opts);

    return factory.createNodeArray([...imports, newLineIdentifier, branchNameConst, newLineIdentifier, ...exportNodes]);
  }

  private createImports(constructClassName: string, constructFileName: string): ts.Node[] {
    const cfnStreamImport = factory.createImportDeclaration(
      undefined,
      factory.createImportClause(
        false,
        undefined,
        factory.createNamedImports([factory.createImportSpecifier(false, undefined, factory.createIdentifier('CfnStream'))]),
      ),
      factory.createStringLiteral('aws-cdk-lib/aws-kinesis'),
    );

    const constructImport = factory.createImportDeclaration(
      undefined,
      factory.createImportClause(
        false,
        undefined,
        factory.createNamedImports([factory.createImportSpecifier(false, undefined, factory.createIdentifier(constructClassName))]),
      ),
      factory.createStringLiteral(`./${constructFileName}`),
    );

    const backendImport = factory.createImportDeclaration(
      undefined,
      factory.createImportClause(
        true,
        undefined,
        factory.createNamedImports([factory.createImportSpecifier(false, undefined, factory.createIdentifier('Backend'))]),
      ),
      factory.createStringLiteral('../backend'),
    );

    return [cfnStreamImport, constructImport, backendImport];
  }

  private createStackCall(): ts.VariableStatement {
    return factory.createVariableStatement(
      undefined,
      factory.createVariableDeclarationList(
        [
          factory.createVariableDeclaration(
            'analyticsStack',
            undefined,
            undefined,
            factory.createCallExpression(
              factory.createPropertyAccessExpression(factory.createIdentifier('backend'), factory.createIdentifier('createStack')),
              undefined,
              [factory.createStringLiteral('analytics')],
            ),
          ),
        ],
        ts.NodeFlags.Const,
      ),
    );
  }

  private createConstructInstantiation(opts: RenderDefineAnalyticsOptions): ts.VariableStatement {
    const { constructClassName, resourceName, shardCount } = opts;

    return factory.createVariableStatement(
      undefined,
      factory.createVariableDeclarationList(
        [
          factory.createVariableDeclaration(
            'analytics',
            undefined,
            undefined,
            factory.createNewExpression(factory.createIdentifier(constructClassName), undefined, [
              factory.createIdentifier('analyticsStack'),
              factory.createStringLiteral(resourceName),
              factory.createObjectLiteralExpression(
                [
                  factory.createPropertyAssignment(
                    factory.createIdentifier('kinesisStreamName'),
                    factory.createStringLiteral(resourceName),
                  ),
                  factory.createPropertyAssignment(
                    factory.createIdentifier('kinesisStreamShardCount'),
                    factory.createNumericLiteral(shardCount),
                  ),
                  factory.createPropertyAssignment(
                    factory.createIdentifier('authPolicyName'),
                    factory.createTemplateExpression(factory.createTemplateHead(`${resourceName}-auth-policy-`), [
                      factory.createTemplateSpan(factory.createIdentifier('branchName'), factory.createTemplateTail('')),
                    ]),
                  ),
                  factory.createPropertyAssignment(
                    factory.createIdentifier('unauthPolicyName'),
                    factory.createTemplateExpression(factory.createTemplateHead(`${resourceName}-unauth-policy-`), [
                      factory.createTemplateSpan(factory.createIdentifier('branchName'), factory.createTemplateTail('')),
                    ]),
                  ),
                  factory.createPropertyAssignment(factory.createIdentifier('authRoleName'), this.createAuthRoleAccess()),
                  factory.createPropertyAssignment(factory.createIdentifier('unauthRoleName'), this.createUnauthRoleAccess()),
                  factory.createShorthandPropertyAssignment(factory.createIdentifier('branchName')),
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

  private createAuthRoleAccess(): ts.PropertyAccessExpression {
    return factory.createPropertyAccessExpression(
      factory.createPropertyAccessExpression(
        factory.createPropertyAccessExpression(
          factory.createPropertyAccessExpression(factory.createIdentifier('backend'), factory.createIdentifier('auth')),
          factory.createIdentifier('resources'),
        ),
        factory.createIdentifier('authenticatedUserIamRole'),
      ),
      factory.createIdentifier('roleName'),
    );
  }

  private createUnauthRoleAccess(): ts.PropertyAccessExpression {
    return factory.createPropertyAccessExpression(
      factory.createPropertyAccessExpression(
        factory.createPropertyAccessExpression(
          factory.createPropertyAccessExpression(factory.createIdentifier('backend'), factory.createIdentifier('auth')),
          factory.createIdentifier('resources'),
        ),
        factory.createIdentifier('unauthenticatedUserIamRole'),
      ),
      factory.createIdentifier('roleName'),
    );
  }

  private createExportStatement(opts: RenderDefineAnalyticsOptions): ts.Node[] {
    const returnStatement = factory.createReturnStatement(factory.createIdentifier('analytics'));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Using 'any' for generated code to avoid complex type inference
    const arrowFunction = factory.createArrowFunction(
      undefined,
      undefined,
      [
        factory.createParameterDeclaration(
          undefined,
          undefined,
          factory.createIdentifier('backend'),
          undefined,
          factory.createTypeReferenceNode(factory.createIdentifier('Backend'), [factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword)]),
        ),
      ],
      undefined,
      factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
      factory.createBlock([this.createStackCall(), this.createConstructInstantiation(opts), returnStatement], true),
    );

    const defineAnalyticsExport = factory.createVariableStatement(
      [factory.createModifier(ts.SyntaxKind.ExportKeyword)],
      factory.createVariableDeclarationList(
        [factory.createVariableDeclaration(factory.createIdentifier('defineAnalytics'), undefined, undefined, arrowFunction)],
        ts.NodeFlags.Const,
      ),
    );

    // postRefactor function
    const { constructClassName, streamName } = opts;
    const postRefactorFunc = factory.createFunctionDeclaration(
      [factory.createModifier(ts.SyntaxKind.ExportKeyword)],
      undefined,
      'postRefactor',
      undefined,
      [
        factory.createParameterDeclaration(
          undefined,
          undefined,
          'analytics',
          undefined,
          factory.createTypeReferenceNode(constructClassName),
        ),
      ],
      undefined,
      factory.createBlock(
        [
          factory.createExpressionStatement(
            factory.createAssignment(
              factory.createPropertyAccessExpression(
                factory.createParenthesizedExpression(
                  factory.createAsExpression(
                    factory.createCallExpression(
                      factory.createPropertyAccessExpression(
                        factory.createPropertyAccessExpression(factory.createIdentifier('analytics'), factory.createIdentifier('node')),
                        factory.createIdentifier('findChild'),
                      ),
                      undefined,
                      [factory.createStringLiteral('KinesisStream')],
                    ),
                    factory.createTypeReferenceNode('CfnStream'),
                  ),
                ),
                factory.createIdentifier('name'),
              ),
              factory.createStringLiteral(`${streamName}`),
            ),
          ),
        ],
        true,
      ),
    );

    return [defineAnalyticsExport, newLineIdentifier, postRefactorFunc];
  }
}
