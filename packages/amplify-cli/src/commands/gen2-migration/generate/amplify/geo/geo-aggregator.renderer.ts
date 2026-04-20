import ts from 'typescript';
import { newLineIdentifier, TS } from '../../_infra/ts';
import { GeoCodegenResult } from './geo.types';

const factory = ts.factory;

/**
 * Renders the top-level geo/resource.ts aggregator file.
 * Pure AST construction — no AWS calls, no side effects.
 */
export class GeoAggregatorRenderer {
  public render(resources: readonly GeoCodegenResult[]): ts.NodeArray<ts.Node> {
    return factory.createNodeArray([
      ...this.renderImports(resources),
      this.renderBackendTypeImport(),
      newLineIdentifier,
      this.renderDefineGeo(resources),
    ]);
  }

  private renderImports(resources: readonly GeoCodegenResult[]): ts.ImportDeclaration[] {
    return resources.map((r) => {
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
  }

  private renderBackendTypeImport(): ts.ImportDeclaration {
    return factory.createImportDeclaration(
      undefined,
      factory.createImportClause(
        true,
        undefined,
        factory.createNamedImports([factory.createImportSpecifier(false, undefined, factory.createIdentifier('Backend'))]),
      ),
      factory.createStringLiteral('../backend'),
    );
  }

  private renderDefineGeo(resources: readonly GeoCodegenResult[]): ts.FunctionDeclaration {
    const functionAssignments = resources.map((r) => {
      const functionName = `define${r.resourceName.charAt(0).toUpperCase()}${r.resourceName.slice(1)}`;
      return TS.constDecl(
        r.resourceName,
        factory.createCallExpression(factory.createIdentifier(functionName), undefined, [factory.createIdentifier('backend')]),
      );
    });

    const addOutputStatement = this.buildAddOutputStatement(resources);

    return factory.createFunctionDeclaration(
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

    if (maps.length > 0) geoProps.push(this.buildMapsSection(maps));
    if (placeIndexes.length > 0) geoProps.push(this.buildSearchIndicesSection(placeIndexes));
    if (geofenceCollections.length > 0) geoProps.push(this.buildGeofenceCollectionsSection(geofenceCollections));

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
    const defaultMap = maps.find((m) => m.isDefault === 'true') ?? maps[0];

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
    const defaultIndex = placeIndexes.find((p) => p.isDefault === 'true') ?? placeIndexes[0];

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
    const defaultCollection = geofenceCollections.find((g) => g.isDefault === 'true') ?? geofenceCollections[0];

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
