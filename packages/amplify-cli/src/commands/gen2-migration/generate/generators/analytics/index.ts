import ts from 'typescript';
import { newLineIdentifier } from '../../ts_factory_utils';

const factory = ts.factory;

/**
 * Parameters for rendering analytics resource.ts file
 */
export interface AnalyticsRenderParameters {
  /** The class name of the generated construct (e.g., 'analyticstodoprojectKinesis') */
  constructClassName: string;
  /** The file name of the generated construct without extension (e.g., 'todoprojectKinesis-construct') */
  constructFileName: string;
  /** The resource name used for construct ID and props (e.g., 'todoprojectKinesis') */
  resourceName: string;
  /** The number of shards for the Kinesis stream */
  shardCount: number;
}

/**
 * Renders the analytics resource.ts file that creates a NestedStack for Kinesis analytics.
 *
 * Generated output:
 * ```typescript
 * import { constructClassName } from './constructFileName';
 * import { Backend } from '@aws-amplify/backend';
 *
 * export const analytics = (backend: Backend<any>) => {
 *   const analyticsStack = backend.createStack('analytics');
 *   new constructClassName(analyticsStack, 'resourceName', {
 *     kinesisStreamName: 'resourceName',
 *     kinesisStreamShardCount: shardCount,
 *     authPolicyName: 'resourceName-auth-policy',
 *     unauthPolicyName: 'resourceName-unauth-policy',
 *     authRoleName: backend.auth.resources.authenticatedUserIamRole.roleName,
 *     unauthRoleName: backend.auth.resources.unauthenticatedUserIamRole.roleName,
 *     branchName: process.env.AWS_BRANCH ?? 'sandbox'
 *   });
 * };
 * ```
 */
export const renderAnalytics = (params: AnalyticsRenderParameters): ts.NodeArray<ts.Node> => {
  const { constructClassName, constructFileName, resourceName, shardCount } = params;

  // Import statement: import { constructClassName } from './constructFileName';
  const constructImport = factory.createImportDeclaration(
    undefined,
    factory.createImportClause(
      false,
      undefined,
      factory.createNamedImports([factory.createImportSpecifier(false, undefined, factory.createIdentifier(constructClassName))]),
    ),
    factory.createStringLiteral(`./${constructFileName}`),
  );

  // Import Backend type: import { Backend } from '@aws-amplify/backend';
  const backendImport = factory.createImportDeclaration(
    undefined,
    factory.createImportClause(
      false,
      undefined,
      factory.createNamedImports([factory.createImportSpecifier(false, undefined, factory.createIdentifier('Backend'))]),
    ),
    factory.createStringLiteral('@aws-amplify/backend'),
  );

  // Create backend.createStack('analytics') call
  const createStackCall = factory.createVariableStatement(
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

  // Create property access for backend.auth.resources.authenticatedUserIamRole.roleName
  const createAuthRoleAccess = () =>
    factory.createPropertyAccessExpression(
      factory.createPropertyAccessExpression(
        factory.createPropertyAccessExpression(
          factory.createPropertyAccessExpression(factory.createIdentifier('backend'), factory.createIdentifier('auth')),
          factory.createIdentifier('resources'),
        ),
        factory.createIdentifier('authenticatedUserIamRole'),
      ),
      factory.createIdentifier('roleName'),
    );

  // Create property access for backend.auth.resources.unauthenticatedUserIamRole.roleName
  const createUnauthRoleAccess = () =>
    factory.createPropertyAccessExpression(
      factory.createPropertyAccessExpression(
        factory.createPropertyAccessExpression(
          factory.createPropertyAccessExpression(factory.createIdentifier('backend'), factory.createIdentifier('auth')),
          factory.createIdentifier('resources'),
        ),
        factory.createIdentifier('unauthenticatedUserIamRole'),
      ),
      factory.createIdentifier('roleName'),
    );

  // Create process.env.AWS_BRANCH ?? 'sandbox'
  const createEnvExpression = () =>
    factory.createBinaryExpression(
      factory.createPropertyAccessExpression(
        factory.createPropertyAccessExpression(factory.createIdentifier('process'), factory.createIdentifier('env')),
        factory.createIdentifier('AWS_BRANCH'),
      ),
      factory.createToken(ts.SyntaxKind.QuestionQuestionToken),
      factory.createStringLiteral('sandbox'),
    );

  // Create the new Construct instantiation with props
  const newConstructExpression = factory.createExpressionStatement(
    factory.createNewExpression(factory.createIdentifier(constructClassName), undefined, [
      factory.createIdentifier('analyticsStack'),
      factory.createStringLiteral(resourceName),
      factory.createObjectLiteralExpression(
        [
          factory.createPropertyAssignment(factory.createIdentifier('kinesisStreamName'), factory.createStringLiteral(resourceName)),
          factory.createPropertyAssignment(factory.createIdentifier('kinesisStreamShardCount'), factory.createNumericLiteral(shardCount)),
          factory.createPropertyAssignment(
            factory.createIdentifier('authPolicyName'),
            factory.createStringLiteral(`${resourceName}-auth-policy`),
          ),
          factory.createPropertyAssignment(
            factory.createIdentifier('unauthPolicyName'),
            factory.createStringLiteral(`${resourceName}-unauth-policy`),
          ),
          factory.createPropertyAssignment(factory.createIdentifier('authRoleName'), createAuthRoleAccess()),
          factory.createPropertyAssignment(factory.createIdentifier('unauthRoleName'), createUnauthRoleAccess()),
          factory.createPropertyAssignment(factory.createIdentifier('branchName'), createEnvExpression()),
        ],
        true,
      ),
    ]),
  );

  // Create the arrow function: export const analytics = (backend: Backend<any>) => { ... }
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
    factory.createBlock([createStackCall, newConstructExpression], true),
  );

  // Export statement: export const analytics = ...
  const exportStatement = factory.createVariableStatement(
    [factory.createModifier(ts.SyntaxKind.ExportKeyword)],
    factory.createVariableDeclarationList(
      [factory.createVariableDeclaration(factory.createIdentifier('analytics'), undefined, undefined, arrowFunction)],
      ts.NodeFlags.Const,
    ),
  );

  return factory.createNodeArray([constructImport, backendImport, newLineIdentifier, exportStatement]);
};
