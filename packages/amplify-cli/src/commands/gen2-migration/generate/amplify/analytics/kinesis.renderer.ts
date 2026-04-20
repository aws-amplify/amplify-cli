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
  readonly constructId: string;

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
    return factory.createNodeArray([
      ...this.renderImports(opts),
      newLineIdentifier,
      TS.createBranchNameDeclaration(),
      newLineIdentifier,
      this.renderDefineAnalytics(opts),
      newLineIdentifier,
      this.renderPostRefactor(opts),
    ]);
  }

  private renderImports(opts: RenderDefineAnalyticsOptions): ts.ImportDeclaration[] {
    return [
      factory.createImportDeclaration(
        undefined,
        factory.createImportClause(
          false,
          undefined,
          factory.createNamedImports([factory.createImportSpecifier(false, undefined, factory.createIdentifier('CfnStream'))]),
        ),
        factory.createStringLiteral('aws-cdk-lib/aws-kinesis'),
      ),
      factory.createImportDeclaration(
        undefined,
        factory.createImportClause(
          false,
          undefined,
          factory.createNamedImports([factory.createImportSpecifier(false, undefined, factory.createIdentifier(opts.constructClassName))]),
        ),
        factory.createStringLiteral(`./${opts.constructFileName}`),
      ),
      factory.createImportDeclaration(
        undefined,
        factory.createImportClause(
          true,
          undefined,
          factory.createNamedImports([factory.createImportSpecifier(false, undefined, factory.createIdentifier('Backend'))]),
        ),
        factory.createStringLiteral('../backend'),
      ),
    ];
  }

  private renderDefineAnalytics(opts: RenderDefineAnalyticsOptions): ts.FunctionDeclaration {
    const { constructClassName, constructId: resourceName, shardCount } = opts;

    const stackCall = factory.createVariableStatement(
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

    const constructInstantiation = factory.createVariableStatement(
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
                  factory.createPropertyAssignment(
                    factory.createIdentifier('authRoleName'),
                    TS.propAccess('backend', 'auth', 'resources', 'authenticatedUserIamRole', 'roleName') as ts.PropertyAccessExpression,
                  ),
                  factory.createPropertyAssignment(
                    factory.createIdentifier('unauthRoleName'),
                    TS.propAccess('backend', 'auth', 'resources', 'unauthenticatedUserIamRole', 'roleName') as ts.PropertyAccessExpression,
                  ),
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

    return factory.createFunctionDeclaration(
      [factory.createModifier(ts.SyntaxKind.ExportKeyword)],
      undefined,
      'defineAnalytics',
      undefined,
      [
        factory.createParameterDeclaration(
          undefined,
          undefined,
          factory.createIdentifier('backend'),
          undefined,
          factory.createTypeReferenceNode('Backend'),
        ),
      ],
      undefined,
      factory.createBlock([stackCall, constructInstantiation, factory.createReturnStatement(factory.createIdentifier('analytics'))], true),
    );
  }

  private renderPostRefactor(opts: RenderDefineAnalyticsOptions): ts.FunctionDeclaration {
    return factory.createFunctionDeclaration(
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
          factory.createTypeReferenceNode(opts.constructClassName),
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
              factory.createStringLiteral(`${opts.streamName}`),
            ),
          ),
        ],
        true,
      ),
    );
  }
}
