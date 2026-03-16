import ts from 'typescript';
import { newLineIdentifier } from '../../ts_factory_utils';
import { GeoResourceRenderParameters } from './index';

const factory = ts.factory;

// Builds the backend.addOutput({ geo: { ... } }) statement using construct output properties
const buildAddOutputStatement = (resources: GeoResourceRenderParameters[]): ts.ExpressionStatement => {
  const maps = resources.filter((r) => r.serviceName === 'Map');
  const placeIndexes = resources.filter((r) => r.serviceName === 'PlaceIndex');
  const geofenceCollections = resources.filter((r) => r.serviceName === 'GeofenceCollection');

  const geoProps: ts.ObjectLiteralElementLike[] = [];

  // aws_region: use the first map's region, or first available resource's region
  const firstResource = maps[0] ?? placeIndexes[0] ?? geofenceCollections[0];
  geoProps.push(
    factory.createPropertyAssignment(
      factory.createIdentifier('aws_region'),
      factory.createPropertyAccessExpression(factory.createIdentifier(firstResource.resourceName), factory.createIdentifier('region')),
    ),
  );

  // maps section
  if (maps.length > 0) {
    const mapItems = maps.map((m) =>
      factory.createPropertyAssignment(
        factory.createComputedPropertyName(
          factory.createPropertyAccessExpression(factory.createIdentifier(m.resourceName), factory.createIdentifier('name')),
        ),
        factory.createObjectLiteralExpression([
          factory.createPropertyAssignment(
            factory.createIdentifier('style'),
            factory.createPropertyAccessExpression(factory.createIdentifier(m.resourceName), factory.createIdentifier('style')),
          ),
        ]),
      ),
    );
    const defaultMap = maps.find((m) => m.isDefault === 'true') ?? maps[0];
    geoProps.push(
      factory.createPropertyAssignment(
        factory.createIdentifier('maps'),
        factory.createObjectLiteralExpression(
          [
            factory.createPropertyAssignment(factory.createIdentifier('items'), factory.createObjectLiteralExpression(mapItems, true)),
            factory.createPropertyAssignment(
              factory.createIdentifier('default'),
              factory.createPropertyAccessExpression(factory.createIdentifier(defaultMap.resourceName), factory.createIdentifier('name')),
            ),
          ],
          true,
        ),
      ),
    );
  }

  // search_indices section
  if (placeIndexes.length > 0) {
    const indexItems = placeIndexes.map((p) =>
      factory.createPropertyAccessExpression(factory.createIdentifier(p.resourceName), factory.createIdentifier('name')),
    );
    const defaultIndex = placeIndexes.find((p) => p.isDefault === 'true') ?? placeIndexes[0];
    geoProps.push(
      factory.createPropertyAssignment(
        factory.createIdentifier('search_indices'),
        factory.createObjectLiteralExpression(
          [
            factory.createPropertyAssignment(factory.createIdentifier('items'), factory.createArrayLiteralExpression(indexItems)),
            factory.createPropertyAssignment(
              factory.createIdentifier('default'),
              factory.createPropertyAccessExpression(factory.createIdentifier(defaultIndex.resourceName), factory.createIdentifier('name')),
            ),
          ],
          true,
        ),
      ),
    );
  }

  // geofence_collections section
  if (geofenceCollections.length > 0) {
    const collectionItems = geofenceCollections.map((g) =>
      factory.createPropertyAccessExpression(factory.createIdentifier(g.resourceName), factory.createIdentifier('name')),
    );
    const defaultCollection = geofenceCollections.find((g) => g.isDefault === 'true') ?? geofenceCollections[0];
    geoProps.push(
      factory.createPropertyAssignment(
        factory.createIdentifier('geofence_collections'),
        factory.createObjectLiteralExpression(
          [
            factory.createPropertyAssignment(factory.createIdentifier('items'), factory.createArrayLiteralExpression(collectionItems)),
            factory.createPropertyAssignment(
              factory.createIdentifier('default'),
              factory.createPropertyAccessExpression(
                factory.createIdentifier(defaultCollection.resourceName),
                factory.createIdentifier('name'),
              ),
            ),
          ],
          true,
        ),
      ),
    );
  }

  return factory.createExpressionStatement(
    factory.createCallExpression(
      factory.createPropertyAccessExpression(factory.createIdentifier('backend'), factory.createIdentifier('addOutput')),
      undefined,
      [
        factory.createObjectLiteralExpression(
          [factory.createPropertyAssignment(factory.createIdentifier('geo'), factory.createObjectLiteralExpression(geoProps, true))],
          true,
        ),
      ],
    ),
  );
};

/**
 * Renders the top-level amplify/geo/resource.ts that aggregates all geo sub-resources
 * and adds geo output configuration for the frontend client.
 *
 * Generated output example:
 * ```typescript
 * import { defineMyMap } from './myMap/resource';
 * import { defineMySearch } from './mySearch/resource';
 * import { defineMyGeofence } from './myGeofence/resource';
 * import { Backend } from '@aws-amplify/backend';
 *
 * export const defineGeo = (backend: Backend<any>) => {
 *   const myMap = defineMyMap(backend);
 *   const mySearch = defineMySearch(backend);
 *   const myGeofence = defineMyGeofence(backend);
 *
 *   backend.addOutput({
 *     geo: {
 *       aws_region: myMap.region,
 *       maps: {
 *         items: { [myMap.name]: { style: myMap.style } },
 *         default: myMap.name,
 *       },
 *       search_indices: {
 *         items: [mySearch.name],
 *         default: mySearch.name,
 *       },
 *       geofence_collections: {
 *         items: [myGeofence.name],
 *         default: myGeofence.name,
 *       },
 *     },
 *   });
 * };
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Using 'any' for generated code Backend<any> type
export const renderGeo = (resources: GeoResourceRenderParameters[]): ts.NodeArray<ts.Node> => {
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
      false,
      undefined,
      factory.createNamedImports([factory.createImportSpecifier(false, undefined, factory.createIdentifier('Backend'))]),
    ),
    factory.createStringLiteral('@aws-amplify/backend'),
  );

  // Assign each define* call to a variable using resourceName
  const functionAssignments = resources.map((r) => {
    const functionName = `define${r.resourceName.charAt(0).toUpperCase()}${r.resourceName.slice(1)}`;
    return factory.createVariableStatement(
      undefined,
      factory.createVariableDeclarationList(
        [
          factory.createVariableDeclaration(
            r.resourceName,
            undefined,
            undefined,
            factory.createCallExpression(factory.createIdentifier(functionName), undefined, [factory.createIdentifier('backend')]),
          ),
        ],
        ts.NodeFlags.Const,
      ),
    );
  });

  // backend.addOutput({ geo: { ... } })
  const addOutputStatement = buildAddOutputStatement(resources);

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
    factory.createBlock([...functionAssignments, addOutputStatement], true),
  );

  const exportStatement = factory.createVariableStatement(
    [factory.createModifier(ts.SyntaxKind.ExportKeyword)],
    factory.createVariableDeclarationList(
      [factory.createVariableDeclaration(factory.createIdentifier('defineGeo'), undefined, undefined, arrowFunction)],
      ts.NodeFlags.Const,
    ),
  );

  return factory.createNodeArray([...resourceImports, backendImport, newLineIdentifier, exportStatement]);
};
