import ts from 'typescript';
import { newLineIdentifier, TS } from '../../ts';
import type { GeoResourceProps } from './geo.generator';

const factory = ts.factory;

/**
 * Renders the top-level geo/resource.ts file.
 * Receives pre-grouped arrays so it never inspects service type.
 */
export class GeoRenderer {
  public render(
    maps: readonly GeoResourceProps[],
    placeIndices: readonly GeoResourceProps[],
    geofenceCollections: readonly GeoResourceProps[],
  ): ts.NodeArray<ts.Node> {
    const allResources = [...maps, ...placeIndices, ...geofenceCollections];
    return factory.createNodeArray([
      ...this.renderImports(allResources),
      this.renderBackendTypeImport(),
      newLineIdentifier,
      this.renderDefineGeo(allResources, maps, placeIndices, geofenceCollections),
    ]);
  }

  private renderImports(resources: readonly GeoResourceProps[]): ts.ImportDeclaration[] {
    return resources.map((r) => {
      const functionName = `define${r.resourceName.charAt(0).toUpperCase()}${r.resourceName.slice(1)}`;
      return TS.namedImport(`./${r.resourceName}/resource`, functionName);
    });
  }

  private renderBackendTypeImport(): ts.ImportDeclaration {
    return TS.typeImport('../backend', 'Backend');
  }

  private renderDefineGeo(
    allResources: readonly GeoResourceProps[],
    maps: readonly GeoResourceProps[],
    placeIndices: readonly GeoResourceProps[],
    geofenceCollections: readonly GeoResourceProps[],
  ): ts.FunctionDeclaration {
    const functionAssignments = allResources.map((r) => {
      const functionName = `define${r.resourceName.charAt(0).toUpperCase()}${r.resourceName.slice(1)}`;
      return TS.declareConst(
        r.resourceName,
        factory.createCallExpression(factory.createIdentifier(functionName), undefined, [factory.createIdentifier('backend')]),
      );
    });

    const addOutputStatement = this.buildAddOutputStatement(allResources, maps, placeIndices, geofenceCollections);

    return TS.exportedFunction('defineGeo', [...functionAssignments, addOutputStatement]);
  }

  private buildAddOutputStatement(
    allResources: readonly GeoResourceProps[],
    maps: readonly GeoResourceProps[],
    placeIndices: readonly GeoResourceProps[],
    geofenceCollections: readonly GeoResourceProps[],
  ): ts.ExpressionStatement {
    const geoProps: ts.ObjectLiteralElementLike[] = [];

    const firstResource = allResources[0];
    geoProps.push(
      factory.createPropertyAssignment(factory.createIdentifier('aws_region'), TS.propAccess(firstResource.resourceName, 'region')),
    );

    if (maps.length > 0) geoProps.push(this.buildMapsSection(maps));
    if (placeIndices.length > 0) geoProps.push(this.buildSearchIndicesSection(placeIndices));
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

  private buildMapsSection(maps: readonly GeoResourceProps[]): ts.PropertyAssignment {
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

  private buildSearchIndicesSection(placeIndices: readonly GeoResourceProps[]): ts.PropertyAssignment {
    const indexItems = placeIndices.map((p) => TS.propAccess(p.resourceName, 'name'));
    const defaultIndex = placeIndices.find((p) => p.isDefault === 'true') ?? placeIndices[0];

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

  private buildGeofenceCollectionsSection(geofenceCollections: readonly GeoResourceProps[]): ts.PropertyAssignment {
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
