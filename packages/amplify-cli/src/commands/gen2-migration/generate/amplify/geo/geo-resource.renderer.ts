import ts from 'typescript';
import { newLineIdentifier, TS } from '../../_infra/ts';
import { GeoResourceProps } from './geo.generator';

const factory = ts.factory;

/**
 * Renders a per-resource geo/{resourceName}/resource.ts file.
 * Pure AST construction — no AWS calls, no side effects.
 * Fully generic: service-specific props come from the generator.
 */
export class GeoResourceRenderer {
  public render(params: GeoResourceProps): ts.NodeArray<ts.Node> {
    return factory.createNodeArray([
      this.renderConstructImport(params),
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

    const returnStatement = factory.createReturnStatement(factory.createIdentifier(resourceName));

    return TS.exportedFunction(functionName, [createStackCall, constructInstantiation, returnStatement]);
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
