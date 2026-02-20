import ts from 'typescript';
import { newLineIdentifier } from '../../ts_factory_utils';
import { GeoResourceRenderParameters } from './index';

const factory = ts.factory;

// Helper: creates `${resourceName}-${branchName}` as a template expression
const createNameWithBranch = (name: string) =>
  factory.createTemplateExpression(factory.createTemplateHead(`${name}-`), [
    factory.createTemplateSpan(factory.createIdentifier('branchName'), factory.createTemplateTail('')),
  ]);

// Builds the backend.addOutput({ geo: { ... } }) statement
const buildAddOutputStatement = (resources: GeoResourceRenderParameters[]): ts.ExpressionStatement => {
  const maps = resources.filter((r) => r.serviceName === 'Map');
  const placeIndexes = resources.filter((r) => r.serviceName === 'PlaceIndex');
  const geofenceCollections = resources.filter((r) => r.serviceName === 'GeofenceCollection');

  const geoProps: ts.ObjectLiteralElementLike[] = [];

  // aws_region: backend.stack.region
  geoProps.push(
    factory.createPropertyAssignment(
      factory.createIdentifier('aws_region'),
      factory.createPropertyAccessExpression(
        factory.createPropertyAccessExpression(factory.createIdentifier('backend'), factory.createIdentifier('stack')),
        factory.createIdentifier('region'),
      ),
    ),
  );

  // maps section
  if (maps.length > 0) {
    const mapItems = maps.map((m) => {
      const style = m.serviceName === 'Map' ? m.mapStyle : '';
      return factory.createPropertyAssignment(
        factory.createComputedPropertyName(createNameWithBranch(m.resourceName)),
        factory.createObjectLiteralExpression([
          factory.createPropertyAssignment(factory.createIdentifier('style'), factory.createStringLiteral(style)),
        ]),
      );
    });
    const defaultMap = maps.find((m) => m.isDefault === 'true') ?? maps[0];
    geoProps.push(
      factory.createPropertyAssignment(
        factory.createIdentifier('maps'),
        factory.createObjectLiteralExpression(
          [
            factory.createPropertyAssignment(factory.createIdentifier('items'), factory.createObjectLiteralExpression(mapItems, true)),
            factory.createPropertyAssignment(factory.createIdentifier('default'), createNameWithBranch(defaultMap.resourceName)),
          ],
          true,
        ),
      ),
    );
  }

  // search_indices section
  if (placeIndexes.length > 0) {
    const indexItems = placeIndexes.map((p) => createNameWithBranch(p.resourceName));
    const defaultIndex = placeIndexes.find((p) => p.isDefault === 'true') ?? placeIndexes[0];
    geoProps.push(
      factory.createPropertyAssignment(
        factory.createIdentifier('search_indices'),
        factory.createObjectLiteralExpression(
          [
            factory.createPropertyAssignment(factory.createIdentifier('items'), factory.createArrayLiteralExpression(indexItems)),
            factory.createPropertyAssignment(factory.createIdentifier('default'), createNameWithBranch(defaultIndex.resourceName)),
          ],
          true,
        ),
      ),
    );
  }

  // geofence_collections section
  if (geofenceCollections.length > 0) {
    const collectionItems = geofenceCollections.map((g) => createNameWithBranch(g.resourceName));
    const defaultCollection = geofenceCollections.find((g) => g.isDefault === 'true') ?? geofenceCollections[0];
    geoProps.push(
      factory.createPropertyAssignment(
        factory.createIdentifier('geofence_collections'),
        factory.createObjectLiteralExpression(
          [
            factory.createPropertyAssignment(factory.createIdentifier('items'), factory.createArrayLiteralExpression(collectionItems)),
            factory.createPropertyAssignment(factory.createIdentifier('default'), createNameWithBranch(defaultCollection.resourceName)),
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
 * const branchName = process.env.AWS_BRANCH ?? 'sandbox';
 *
 * export const defineGeo = (backend: Backend<any>) => {
 *   defineMyMap(backend);
 *   defineMySearch(backend);
 *   defineMyGeofence(backend);
 *
 *   backend.addOutput({
 *     geo: {
 *       aws_region: backend.stack.region,
 *       maps: {
 *         items: { [`myMap-${branchName}`]: { style: 'VectorEsriStreets' } },
 *         default: `myMap-${branchName}`,
 *       },
 *       search_indices: {
 *         items: [`mySearch-${branchName}`],
 *         default: `mySearch-${branchName}`,
 *       },
 *       geofence_collections: {
 *         items: [`myGeofence-${branchName}`],
 *         default: `myGeofence-${branchName}`,
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

  // const branchName = process.env.AWS_BRANCH ?? 'sandbox';
  const branchNameConst = factory.createVariableStatement(
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

  // Per-resource function calls
  const functionCalls = resources.map((r) => {
    const functionName = `define${r.resourceName.charAt(0).toUpperCase()}${r.resourceName.slice(1)}`;
    return factory.createExpressionStatement(
      factory.createCallExpression(factory.createIdentifier(functionName), undefined, [factory.createIdentifier('backend')]),
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
    factory.createBlock([...functionCalls, addOutputStatement], true),
  );

  const exportStatement = factory.createVariableStatement(
    [factory.createModifier(ts.SyntaxKind.ExportKeyword)],
    factory.createVariableDeclarationList(
      [factory.createVariableDeclaration(factory.createIdentifier('defineGeo'), undefined, undefined, arrowFunction)],
      ts.NodeFlags.Const,
    ),
  );

  return factory.createNodeArray([
    ...resourceImports,
    backendImport,
    newLineIdentifier,
    branchNameConst,
    newLineIdentifier,
    exportStatement,
  ]);
};
