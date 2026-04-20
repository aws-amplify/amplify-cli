import ts from 'typescript';
import { newLineIdentifier, TS } from '../../_infra/ts';
import { GeoCodegenResult } from './geo.types';

const factory = ts.factory;

/**
 * Renders a per-resource geo/{resourceName}/resource.ts file.
 * Pure AST construction — no AWS calls, no side effects.
 */
export class GeoResourceRenderer {
  public render(params: GeoCodegenResult): ts.NodeArray<ts.Node> {
    return factory.createNodeArray([
      this.renderConstructImport(params),
      this.renderBackendTypeImport(),
      newLineIdentifier,
      TS.createBranchNameDeclaration(),
      newLineIdentifier,
      this.renderDefineResource(params),
    ]);
  }

  private renderConstructImport(params: GeoCodegenResult): ts.ImportDeclaration {
    return factory.createImportDeclaration(
      undefined,
      factory.createImportClause(
        false,
        undefined,
        factory.createNamedImports([factory.createImportSpecifier(false, undefined, factory.createIdentifier(params.constructClassName))]),
      ),
      factory.createStringLiteral(`./${params.constructFileName}`),
    );
  }

  private renderBackendTypeImport(): ts.ImportDeclaration {
    return factory.createImportDeclaration(
      undefined,
      factory.createImportClause(
        true,
        undefined,
        factory.createNamedImports([factory.createImportSpecifier(false, undefined, factory.createIdentifier('Backend'))]),
      ),
      factory.createStringLiteral('../../backend'),
    );
  }

  private renderDefineResource(params: GeoCodegenResult): ts.FunctionDeclaration {
    const { constructClassName, resourceName } = params;
    const functionName = `define${resourceName.charAt(0).toUpperCase()}${resourceName.slice(1)}`;

    const createStackCall = TS.constDecl(
      `${resourceName}Stack`,
      factory.createCallExpression(TS.propAccess('backend', 'createStack') as ts.PropertyAccessExpression, undefined, [
        factory.createStringLiteral(`geo${resourceName}`),
      ]),
    );

    const constructProps = this.buildConstructProps(params);

    const constructInstantiation = TS.constDecl(
      resourceName,
      factory.createNewExpression(factory.createIdentifier(constructClassName), undefined, [
        factory.createIdentifier(`${resourceName}Stack`),
        factory.createStringLiteral(resourceName),
        factory.createObjectLiteralExpression(constructProps, true),
      ]),
    );

    const returnStatement = factory.createReturnStatement(factory.createIdentifier(resourceName));

    return factory.createFunctionDeclaration(
      [factory.createModifier(ts.SyntaxKind.ExportKeyword)],
      undefined,
      factory.createIdentifier(functionName),
      undefined,
      [
        factory.createParameterDeclaration(
          undefined,
          undefined,
          factory.createIdentifier('backend'),
          undefined,
          factory.createTypeReferenceNode(factory.createIdentifier('Backend')),
        ),
      ],
      undefined,
      factory.createBlock([createStackCall, constructInstantiation, returnStatement], true),
    );
  }

  private buildConstructProps(params: GeoCodegenResult): ts.ObjectLiteralElementLike[] {
    const props: ts.ObjectLiteralElementLike[] = [];

    if (params.serviceName === 'Map' || params.serviceName === 'PlaceIndex') {
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

    props.push(...this.getServiceSpecificProps(params));
    props.push(factory.createShorthandPropertyAssignment(factory.createIdentifier('branchName')));
    props.push(factory.createPropertyAssignment(factory.createIdentifier('isDefault'), factory.createStringLiteral(params.isDefault)));

    return props;
  }

  private getServiceSpecificProps(params: GeoCodegenResult): ts.PropertyAssignment[] {
    switch (params.serviceName) {
      case 'Map':
        return [
          factory.createPropertyAssignment(factory.createIdentifier('mapName'), factory.createStringLiteral(params.mapName)),
          factory.createPropertyAssignment(factory.createIdentifier('mapStyle'), factory.createStringLiteral(params.mapStyle)),
        ];
      case 'PlaceIndex':
        return [
          factory.createPropertyAssignment(factory.createIdentifier('indexName'), factory.createStringLiteral(params.indexName)),
          factory.createPropertyAssignment(factory.createIdentifier('dataProvider'), factory.createStringLiteral(params.dataProvider)),
          factory.createPropertyAssignment(
            factory.createIdentifier('dataSourceIntendedUse'),
            factory.createStringLiteral(params.dataSourceIntendedUse),
          ),
        ];
      case 'GeofenceCollection':
        return [
          factory.createPropertyAssignment(factory.createIdentifier('collectionName'), factory.createStringLiteral(params.collectionName)),
        ];
      default: {
        const _exhaustiveCheck: never = params;
        throw new Error(`Unsupported geo service type: ${(_exhaustiveCheck as GeoCodegenResult).serviceName}`);
      }
    }
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
