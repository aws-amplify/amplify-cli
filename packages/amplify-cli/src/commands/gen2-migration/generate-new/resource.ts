import ts from 'typescript';
import { newLineIdentifier } from './ts-factory-utils';
const factory = ts.factory;
/**
 * Parameters for rendering a single-export resource.ts file.
 */
export type ResourceTsParameters = {
  readonly additionalImportedBackendIdentifiers?: Record<string, Set<string>>;
  readonly backendFunctionConstruct: string;
  readonly functionCallParameter: ts.ObjectLiteralExpression;
  readonly exportedVariableName: ts.Identifier;
  readonly postImportStatements?: ts.Node[];
  readonly postExportStatements?: ts.Node[];
};
/**
 * Renders a resource.ts file with imports, a single exported const,
 * and optional pre/post statements.
 */
export function renderResourceTsFile({
  additionalImportedBackendIdentifiers = {},
  backendFunctionConstruct,
  functionCallParameter,
  exportedVariableName,
  postImportStatements,
  postExportStatements,
}: ResourceTsParameters): ts.NodeArray<ts.Node> {
  const backendFunctionIdentifier = factory.createIdentifier(backendFunctionConstruct);
  const importStatements = renderImportStatements(additionalImportedBackendIdentifiers);
  const functionCall = factory.createCallExpression(backendFunctionIdentifier, undefined, [functionCallParameter]);
  const exportedVariable = factory.createVariableDeclaration(exportedVariableName, undefined, undefined, functionCall);
  const exportStatement = factory.createVariableStatement(
    [factory.createModifier(ts.SyntaxKind.ExportKeyword)],
    factory.createVariableDeclarationList([exportedVariable], ts.NodeFlags.Const),
  );

  return factory.createNodeArray([
    ...importStatements,
    ...(postImportStatements !== undefined && postImportStatements.length > 0 ? [newLineIdentifier, ...postImportStatements] : []),
    newLineIdentifier,
    exportStatement,
    ...(postExportStatements !== undefined && postExportStatements.length > 0 ? [newLineIdentifier, ...postExportStatements] : []),
  ]);
}

function renderImportStatements(additionalImportedBackendIdentifiers: Record<string, Set<string>>) {
  const importStatements: ts.ImportDeclaration[] = [];
  for (const [packageName, identifiers] of Object.entries(additionalImportedBackendIdentifiers)) {
    const importSpecifiers: ts.ImportSpecifier[] = [];

    identifiers.forEach((identifier) => {
      importSpecifiers.push(factory.createImportSpecifier(false, undefined, factory.createIdentifier(identifier)));
    });

    const importStatement = factory.createImportDeclaration(
      undefined,
      factory.createImportClause(false, undefined, factory.createNamedImports(importSpecifiers)),
      factory.createStringLiteral(packageName),
    );

    importStatements.push(importStatement);
  }

  return importStatements;
}
