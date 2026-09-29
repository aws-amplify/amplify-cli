import ts from 'typescript';
import { newLineIdentifier, TS } from '../../ts';
import { DiscoveredResource } from '../../../_common/gen1-app';
import { ANALYTICS_RESOURCES_TO_RETAIN } from '../../../_common/resource-types';

const factory = ts.factory;

/**
 * Options for rendering an analytics resource.ts file.
 */
export interface AnalyticsRenderOptions {
  readonly constructClassName: string;
  readonly constructFileName: string;
  readonly shardCount: number;
  readonly streamName: string;
}

/**
 * Renders a defineAnalytics() resource.ts file from Gen1 Kinesis configuration.
 * Pure — no AWS calls, no side effects.
 */
export class AnalyticsRenderer {
  private readonly resource: DiscoveredResource;

  public constructor(resource: DiscoveredResource) {
    this.resource = resource;
  }
  /**
   * Produces the complete TypeScript AST for analytics/resource.ts.
   */
  public render(opts: AnalyticsRenderOptions): ts.NodeArray<ts.Node> {
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

  private renderImports(opts: AnalyticsRenderOptions): ts.ImportDeclaration[] {
    return [
      TS.namedImport('aws-cdk-lib', 'CfnResource'),
      TS.namedImport('aws-cdk-lib/aws-kinesis', 'CfnStream'),
      TS.namedImport(`./${opts.constructFileName}`, opts.constructClassName),
      TS.typeImport('../backend', 'Backend'),
    ];
  }

  private renderDefineAnalytics(opts: AnalyticsRenderOptions): ts.FunctionDeclaration {
    const { constructClassName, shardCount } = opts;
    const resourceName = this.resource.resourceName;
    const constructId = resourceName.charAt(0).toUpperCase() + resourceName.slice(1);

    const stackCall = factory.createVariableStatement(
      undefined,
      factory.createVariableDeclarationList(
        [
          factory.createVariableDeclaration(
            'stack',
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
              factory.createIdentifier('stack'),
              factory.createStringLiteral(constructId),
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

    return TS.exportedFunction('defineAnalytics', [
      stackCall,
      constructInstantiation,
      TS.retentionLoop(TS.propAccess('stack', 'node'), ANALYTICS_RESOURCES_TO_RETAIN),
      factory.createReturnStatement(factory.createIdentifier('analytics')),
    ]);
  }

  private renderPostRefactor(opts: AnalyticsRenderOptions): ts.FunctionDeclaration {
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
          TS.castAssign(
            factory.createCallExpression(TS.propAccess('analytics', 'node', 'findChild') as ts.PropertyAccessExpression, undefined, [
              factory.createStringLiteral('KinesisStream'),
            ]),
            'CfnStream',
            'name',
            factory.createStringLiteral(`${opts.streamName}`),
          ),
        ],
        true,
      ),
    );
  }
}
