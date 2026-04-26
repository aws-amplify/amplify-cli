import ts from 'typescript';
import { newLineIdentifier, TS } from '../../ts';
import { GeoResourceProps } from './geo.generator';

const factory = ts.factory;

const GEO_ARN_RESOURCE_TYPE: Record<string, string> = {
  Map: 'map',
  PlaceIndex: 'place-index',
  GeofenceCollection: 'geofence-collection',
};

/**
 * Renders a per-resource geo/{resourceName}/resource.ts file.
 * Pure AST construction — no AWS calls, no side effects.
 * Fully generic: service-specific props come from the generator.
 */
export class GeoResourceRenderer {
  public render(params: GeoResourceProps): ts.NodeArray<ts.Node> {
    const needsIamImport = params.gen1Actions.length > 0;
    return factory.createNodeArray([
      this.renderConstructImport(params),
      ...(needsIamImport ? [TS.namedImport('aws-cdk-lib/aws-iam', 'Policy', 'PolicyStatement')] : []),
      this.renderBackendTypeImport(),
      newLineIdentifier,
      TS.createBranchNameDeclaration(),
      newLineIdentifier,
      this.renderDefineResource(params),
    ]);
  }

  private renderConstructImport(params: GeoResourceProps): ts.ImportDeclaration {
    return TS.namedImport(`./${params.constructFileName}`, params.constructClassName);
  }

  private renderBackendTypeImport(): ts.ImportDeclaration {
    return TS.typeImport('../../backend', 'Backend');
  }

  private renderDefineResource(params: GeoResourceProps): ts.FunctionDeclaration {
    const { constructClassName, resourceName } = params;
    const functionName = `define${resourceName.charAt(0).toUpperCase()}${resourceName.slice(1)}`;

    const createStackCall = TS.declareConst(
      `${resourceName}Stack`,
      factory.createCallExpression(TS.propAccess('backend', 'createStack') as ts.PropertyAccessExpression, undefined, [
        factory.createStringLiteral(`geo${resourceName}`),
      ]),
    );

    const constructProps = this.buildConstructProps(params);

    const constructInstantiation = TS.declareConst(
      resourceName,
      factory.createNewExpression(factory.createIdentifier(constructClassName), undefined, [
        factory.createIdentifier(`${resourceName}Stack`),
        factory.createStringLiteral(resourceName),
        factory.createObjectLiteralExpression(constructProps, true),
      ]),
    );

    const body: ts.Statement[] = [createStackCall, constructInstantiation];

    if (params.gen1Actions.length > 0) {
      body.push(...this.renderIamPolicy(params));
    }

    body.push(factory.createReturnStatement(factory.createIdentifier(resourceName)));

    return TS.exportedFunction(functionName, body);
  }

  /** Renders the IAM Policy + attachInlinePolicy calls for a geo resource. */
  private renderIamPolicy(params: GeoResourceProps): ts.Statement[] {
    const { resourceName, gen1Actions, gen1ResourceName, serviceName, groupRoles, needsAuthAndUnauthRoles } = params;
    const arnResourceType = GEO_ARN_RESOURCE_TYPE[serviceName];
    const stackVar = `${resourceName}Stack`;

    // Build the ARN template literal: `arn:aws:geo:${stack.region}:${stack.account}:map/resourceName-env`
    const arnExpr = factory.createTemplateExpression(factory.createTemplateHead('arn:aws:geo:'), [
      factory.createTemplateSpan(TS.propAccess(stackVar, 'region') as ts.Expression, factory.createTemplateMiddle(':')),
      factory.createTemplateSpan(
        TS.propAccess(stackVar, 'account') as ts.Expression,
        factory.createTemplateTail(`:${arnResourceType}/${gen1ResourceName}`),
      ),
    ]);

    // new Policy(resource, 'gen1AuthPolicy', { statements: [...] })
    const policyDecl = TS.declareConst(
      'policy',
      factory.createNewExpression(factory.createIdentifier('Policy'), undefined, [
        factory.createIdentifier(resourceName),
        factory.createStringLiteral('gen1AuthPolicy'),
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
                        factory.createArrayLiteralExpression(gen1Actions.map((a) => factory.createStringLiteral(a))),
                      ),
                      factory.createPropertyAssignment('resources', factory.createArrayLiteralExpression([arnExpr])),
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
    );

    const statements: ts.Statement[] = [policyDecl];

    // Map/PlaceIndex: attach to auth + unauth roles
    if (needsAuthAndUnauthRoles) {
      statements.push(createAttachInlinePolicy(TS.propAccess('backend', 'auth', 'resources', 'authenticatedUserIamRole') as ts.Expression));
      statements.push(
        createAttachInlinePolicy(TS.propAccess('backend', 'auth', 'resources', 'unauthenticatedUserIamRole') as ts.Expression),
      );
    }

    // Attach to all group roles
    for (const groupRole of groupRoles) {
      const groupAccess = factory.createPropertyAccessExpression(
        factory.createElementAccessExpression(
          TS.propAccess('backend', 'auth', 'resources', 'groups') as ts.PropertyAccessExpression,
          factory.createStringLiteral(groupRole.groupName),
        ),
        factory.createIdentifier('role'),
      );
      statements.push(createAttachInlinePolicy(groupAccess));
    }

    return statements;
  }

  private buildConstructProps(params: GeoResourceProps): ts.ObjectLiteralElementLike[] {
    const props: ts.ObjectLiteralElementLike[] = [];

    if (params.needsAuthAndUnauthRoles) {
      props.push(factory.createPropertyAssignment(factory.createIdentifier('authRoleName'), createAuthRoleAccess()));
      props.push(factory.createPropertyAssignment(factory.createIdentifier('unauthRoleName'), createUnauthRoleAccess()));
    }

    if (params.userPoolIdParamName) {
      props.push(factory.createPropertyAssignment(factory.createIdentifier(params.userPoolIdParamName), createUserPoolIdAccess()));
    }

    for (const groupRole of params.groupRoles) {
      props.push(
        factory.createPropertyAssignment(factory.createIdentifier(groupRole.paramName), createGroupRoleAccess(groupRole.groupName)),
      );
    }

    for (const prop of params.serviceSpecificProps) {
      props.push(factory.createPropertyAssignment(factory.createIdentifier(prop.key), factory.createStringLiteral(prop.value)));
    }

    props.push(factory.createShorthandPropertyAssignment(factory.createIdentifier('branchName')));
    props.push(factory.createPropertyAssignment(factory.createIdentifier('isDefault'), factory.createStringLiteral(params.isDefault)));

    return props;
  }
}

function createAuthRoleAccess(): ts.PropertyAccessExpression {
  return TS.propAccess('backend', 'auth', 'resources', 'authenticatedUserIamRole', 'roleName') as ts.PropertyAccessExpression;
}

function createUnauthRoleAccess(): ts.PropertyAccessExpression {
  return TS.propAccess('backend', 'auth', 'resources', 'unauthenticatedUserIamRole', 'roleName') as ts.PropertyAccessExpression;
}

function createUserPoolIdAccess(): ts.PropertyAccessExpression {
  return TS.propAccess('backend', 'auth', 'resources', 'userPool', 'userPoolId') as ts.PropertyAccessExpression;
}

function createGroupRoleAccess(groupName: string): ts.PropertyAccessExpression {
  return factory.createPropertyAccessExpression(
    factory.createPropertyAccessExpression(
      factory.createElementAccessExpression(
        TS.propAccess('backend', 'auth', 'resources', 'groups') as ts.PropertyAccessExpression,
        factory.createStringLiteral(groupName),
      ),
      factory.createIdentifier('role'),
    ),
    factory.createIdentifier('roleName'),
  );
}

/** Creates `roleExpr.attachInlinePolicy(policy)`. */
function createAttachInlinePolicy(roleExpr: ts.Expression): ts.ExpressionStatement {
  return factory.createExpressionStatement(
    factory.createCallExpression(
      factory.createPropertyAccessExpression(roleExpr, factory.createIdentifier('attachInlinePolicy')),
      undefined,
      [factory.createIdentifier('policy')],
    ),
  );
}
