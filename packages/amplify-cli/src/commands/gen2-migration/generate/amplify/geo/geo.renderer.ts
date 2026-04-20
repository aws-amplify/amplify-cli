import ts from 'typescript';
import { newLineIdentifier, TS } from '../../_infra/ts';
import { GeoCodegenResult } from './geo-cfn-converter';

const factory = ts.factory;

/**
 * Renders per-resource and aggregator geo resource.ts files.
 * Pure AST construction — no AWS calls, no side effects.
 */
export class GeoRenderer {
  /**
   * Renders a per-resource geo/{resourceName}/resource.ts file.
   *
   * Produces a defineXxx function that creates a CDK stack,
   * instantiates the generated construct, and returns it.
   */
  public renderResource(params: GeoCodegenResult): ts.NodeArray<ts.Node> {
    const { constructClassName, constructFileName, resourceName } = params;

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
      factory.createStringLiteral('../../backend'),
    );

    const branchNameConst = TS.createBranchNameDeclaration();
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

    // export function defineXxx(backend: Backend) { ... }
    const functionDeclaration = factory.createFunctionDeclaration(
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

    return factory.createNodeArray([
      constructImport,
      backendImport,
      newLineIdentifier,
      branchNameConst,
      newLineIdentifier,
      functionDeclaration,
    ]);
  }

  /**
   * Renders the top-level geo/resource.ts aggregator that imports all
   * sub-resources and calls backend.addOutput() with geo configuration.
   */
  public renderAggregator(resources: readonly GeoCodegenResult[]): ts.NodeArray<ts.Node> {
    const resourceImports = resources.map((r) => {
      const functionName = `define${r.resourceName.charAt(0).toUpperCase()}${r.resourceName.slice(1)}`;
      return factory.createImportDeclaration(
        undefined,
        factory.createImportClause(
          false,
          undefined,
          factory.createNamedImports([factory.createImportSpecifier(false, undefined, factory.createIdentifier(functionName))]),
        ),
        factory.createStringLiteral(`./${r.resourceName}/resource`),
      );
    });

    const backendImport = factory.createImportDeclaration(
      undefined,
      factory.createImportClause(
        true,
        undefined,
        factory.createNamedImports([factory.createImportSpecifier(false, undefined, factory.createIdentifier('Backend'))]),
      ),
      factory.createStringLiteral('../backend'),
    );

    const functionAssignments = resources.map((r) => {
      const functionName = `define${r.resourceName.charAt(0).toUpperCase()}${r.resourceName.slice(1)}`;
      return TS.constDecl(
        r.resourceName,
        factory.createCallExpression(factory.createIdentifier(functionName), undefined, [factory.createIdentifier('backend')]),
      );
    });

    const addOutputStatement = this.buildAddOutputStatement(resources);

    // export function defineGeo(backend: Backend) { ... }
    const functionDeclaration = factory.createFunctionDeclaration(
      [factory.createModifier(ts.SyntaxKind.ExportKeyword)],
      undefined,
      factory.createIdentifier('defineGeo'),
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
      factory.createBlock([...functionAssignments, addOutputStatement], true),
    );

    return factory.createNodeArray([...resourceImports, backendImport, newLineIdentifier, functionDeclaration]);
  }

  private buildConstructProps(params: GeoCodegenResult): ts.ObjectLiteralElementLike[] {
    const props: ts.ObjectLiteralElementLike[] = [];

    // Map and PlaceIndex get authRoleName/unauthRoleName; GeofenceCollection does not
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

  private buildAddOutputStatement(resources: readonly GeoCodegenResult[]): ts.ExpressionStatement {
    const maps = resources.filter((r) => r.serviceName === 'Map');
    const placeIndexes = resources.filter((r) => r.serviceName === 'PlaceIndex');
    const geofenceCollections = resources.filter((r) => r.serviceName === 'GeofenceCollection');

    const geoProps: ts.ObjectLiteralElementLike[] = [];

    const firstResource = maps[0] ?? placeIndexes[0] ?? geofenceCollections[0];
    geoProps.push(
      factory.createPropertyAssignment(factory.createIdentifier('aws_region'), TS.propAccess(firstResource.resourceName, 'region')),
    );

    if (maps.length > 0) {
      geoProps.push(this.buildMapsSection(maps));
    }
    if (placeIndexes.length > 0) {
      geoProps.push(this.buildSearchIndicesSection(placeIndexes));
    }
    if (geofenceCollections.length > 0) {
      geoProps.push(this.buildGeofenceCollectionsSection(geofenceCollections));
    }

    return factory.createExpressionStatement(
      factory.createCallExpression(TS.propAccess('backend', 'addOutput') as ts.PropertyAccessExpression, undefined, [
        factory.createObjectLiteralExpression(
          [factory.createPropertyAssignment(factory.createIdentifier('geo'), factory.createObjectLiteralExpression(geoProps, true))],
          true,
        ),
      ]),
    );
  }

  private buildMapsSection(maps: readonly GeoCodegenResult[]): ts.PropertyAssignment {
    const mapItems = maps.map((m) =>
      factory.createPropertyAssignment(
        factory.createComputedPropertyName(TS.propAccess(m.resourceName, 'name')),
        factory.createObjectLiteralExpression([
          factory.createPropertyAssignment(factory.createIdentifier('style'), TS.propAccess(m.resourceName, 'style')),
        ]),
      ),
    );
    const defaultMap = maps.find((m) => m.serviceName === 'Map' && m.isDefault === 'true') ?? maps[0];

    return factory.createPropertyAssignment(
      factory.createIdentifier('maps'),
      factory.createObjectLiteralExpression(
        [
          factory.createPropertyAssignment(factory.createIdentifier('items'), factory.createObjectLiteralExpression(mapItems, true)),
          factory.createPropertyAssignment(factory.createIdentifier('default'), TS.propAccess(defaultMap.resourceName, 'name')),
        ],
        true,
      ),
    );
  }

  private buildSearchIndicesSection(placeIndexes: readonly GeoCodegenResult[]): ts.PropertyAssignment {
    const indexItems = placeIndexes.map((p) => TS.propAccess(p.resourceName, 'name'));
    const defaultIndex = placeIndexes.find((p) => p.serviceName === 'PlaceIndex' && p.isDefault === 'true') ?? placeIndexes[0];

    return factory.createPropertyAssignment(
      factory.createIdentifier('search_indices'),
      factory.createObjectLiteralExpression(
        [
          factory.createPropertyAssignment(factory.createIdentifier('items'), factory.createArrayLiteralExpression(indexItems)),
          factory.createPropertyAssignment(factory.createIdentifier('default'), TS.propAccess(defaultIndex.resourceName, 'name')),
        ],
        true,
      ),
    );
  }

  private buildGeofenceCollectionsSection(geofenceCollections: readonly GeoCodegenResult[]): ts.PropertyAssignment {
    const collectionItems = geofenceCollections.map((g) => TS.propAccess(g.resourceName, 'name'));
    const defaultCollection =
      geofenceCollections.find((g) => g.serviceName === 'GeofenceCollection' && g.isDefault === 'true') ?? geofenceCollections[0];

    return factory.createPropertyAssignment(
      factory.createIdentifier('geofence_collections'),
      factory.createObjectLiteralExpression(
        [
          factory.createPropertyAssignment(factory.createIdentifier('items'), factory.createArrayLiteralExpression(collectionItems)),
          factory.createPropertyAssignment(factory.createIdentifier('default'), TS.propAccess(defaultCollection.resourceName, 'name')),
        ],
        true,
      ),
    );
  }
}

/** backend.auth.resources.authenticatedUserIamRole.roleName */
function createAuthRoleAccess(): ts.PropertyAccessExpression {
  return TS.propAccess('backend', 'auth', 'resources', 'authenticatedUserIamRole', 'roleName') as ts.PropertyAccessExpression;
}

/** backend.auth.resources.unauthenticatedUserIamRole.roleName */
function createUnauthRoleAccess(): ts.PropertyAccessExpression {
  return TS.propAccess('backend', 'auth', 'resources', 'unauthenticatedUserIamRole', 'roleName') as ts.PropertyAccessExpression;
}

/** backend.auth.resources.userPool.userPoolId */
function createUserPoolIdAccess(): ts.PropertyAccessExpression {
  return TS.propAccess('backend', 'auth', 'resources', 'userPool', 'userPoolId') as ts.PropertyAccessExpression;
}

/** backend.auth.resources.groups['groupName'].role.roleName */
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
