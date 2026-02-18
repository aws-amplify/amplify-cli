import ts from 'typescript';
import { newLineIdentifier } from '../../ts_factory_utils';
import { GeoResourceRenderParameters } from './index';

const factory = ts.factory;

/**
 * Renders the top-level amplify/geo/resource.ts that aggregates all geo sub-resources.
 *
 * Generated output example:
 * ```typescript
 * import { defineMyMap } from './myMap/resource';
 * import { defineMySearch } from './mySearch/resource';
 * import { defineMyGeofence } from './myGeofence/resource';
 * import { Backend } from '@aws-amplify/backend';
 *
 * export const defineGeo = (backend: Backend<any>) => {
 *   defineMyMap(backend);
 *   defineMySearch(backend);
 *   defineMyGeofence(backend);
 * };
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Using 'any' for generated code Backend<any> type
export const renderGeo = (resources: GeoResourceRenderParameters[]): ts.NodeArray<ts.Node> => {
  // Import each per-resource define function
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

  // import { Backend } from '@aws-amplify/backend';
  const backendImport = factory.createImportDeclaration(
    undefined,
    factory.createImportClause(
      false,
      undefined,
      factory.createNamedImports([factory.createImportSpecifier(false, undefined, factory.createIdentifier('Backend'))]),
    ),
    factory.createStringLiteral('@aws-amplify/backend'),
  );

  // Call each per-resource function with backend
  const functionCalls = resources.map((r) => {
    const functionName = `define${r.resourceName.charAt(0).toUpperCase()}${r.resourceName.slice(1)}`;
    return factory.createExpressionStatement(
      factory.createCallExpression(factory.createIdentifier(functionName), undefined, [factory.createIdentifier('backend')]),
    );
  });

  // export const defineGeo = (backend: Backend<any>) => { ... };
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
    factory.createBlock(functionCalls, true),
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
