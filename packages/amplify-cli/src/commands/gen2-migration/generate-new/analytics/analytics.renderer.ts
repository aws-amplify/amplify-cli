import ts from 'typescript';
import { newLineIdentifier } from '../ts-factory-utils';

const factory = ts.factory;

/**
 * Options for rendering an analytics resource.ts file.
 */
export interface RenderDefineAnalyticsOptions {
  /** The class name of the generated construct (e.g., 'analyticstodoprojectKinesis') */
  readonly constructClassName: string;
  /** The file name of the generated construct without extension (e.g., 'todoprojectKinesis-construct') */
  readonly constructFileName: string;
  /** The resource name used for construct ID and props (e.g., 'todoprojectKinesis') */
  readonly resourceName: string;
  /** The number of shards for the Kinesis stream */
  readonly shardCount: number;
  /** The actual deployed Kinesis stream name from Gen1 */
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
    const branchNameConst = this.createBranchNameConst();
    const exportStatement = this.createExportStatement(opts);

    return factory.createNodeArray([...imports, newLineIdentifier, branchNameConst, newLineIdentifier, exportStatement]);
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
        false,
        undefined,
        factory.createNamedImports([factory.createImportSpecifier(false, undefined, factory.createIdentifier('Backend'))]),
      ),
      factory.createStringLiteral('@aws-amplify/backend'),
    );

    return [cfnStreamImport, constructImport, backendImport];
  }

  private createBranchNameConst(): ts.VariableStatement {
    return factory.createVariableStatement(
      undefined,
      factory.createVariableDeclarationList(
        [
          factory.createVariableDeclaration(
            'branchName',
            undefined,
            undefined,
            factory.createBinaryExpression(
              factory.createPropertyAccessExpression(
                factory.createPropertyAccessExpression(factory.createIdentifier('process'), factory.createIdentifier('env')),
                factory.createIdentifier('AWS_BRANCH'),
              ),
              factory.createToken(ts.SyntaxKind.QuestionQuestionToken),
              factory.createStringLiteral('sandbox'),
            ),
          ),
        ],
        ts.NodeFlags.Const,
      ),
    );
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

  private createExportStatement(opts: RenderDefineAnalyticsOptions): ts.VariableStatement {
    const { streamName } = opts;

    const returnStatement = factory.createReturnStatement(factory.createIdentifier('analytics'));
    const postRefactorComment = ts.addSyntheticLeadingComment(
      returnStatement,
      ts.SyntaxKind.SingleLineCommentTrivia,
      'Use this kinesis stream name post-refactor',
      true,
    );
    const postRefactorCode = ts.addSyntheticLeadingComment(
      postRefactorComment,
      ts.SyntaxKind.SingleLineCommentTrivia,
      `(analytics.node.findChild('KinesisStream') as CfnStream).name = "${streamName}"`,
      false,
    );

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
      factory.createBlock([this.createStackCall(), this.createConstructInstantiation(opts), postRefactorCode], true),
    );

    return factory.createVariableStatement(
      [factory.createModifier(ts.SyntaxKind.ExportKeyword)],
      factory.createVariableDeclarationList(
        [factory.createVariableDeclaration(factory.createIdentifier('defineAnalytics'), undefined, undefined, arrowFunction)],
        ts.NodeFlags.Const,
      ),
    );
  }
}
