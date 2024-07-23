import ts from 'typescript';
const factory = ts.factory;
export type ResourceTsParameters = {
  additionalImportedBackendIdentifiers?: string[];
  importedPackageName: string;
  backendFunctionConstruct: string;
  functionCallParameter: ts.ObjectLiteralExpression;
  exportedVariableName: ts.Identifier;
  postImportStatements?: ts.Node[];
};
export function renderResourceTsFile({
  additionalImportedBackendIdentifiers = [],
  backendFunctionConstruct,
  importedPackageName,
  functionCallParameter,
  exportedVariableName,
  postImportStatements,
}: ResourceTsParameters): ts.NodeArray<ts.Node> {
  const backendFunctionIdentifier = factory.createIdentifier(backendFunctionConstruct);
  const importSpecifiers = [factory.createImportSpecifier(false, undefined, backendFunctionIdentifier)].concat(
    additionalImportedBackendIdentifiers.map((importedFunctionName) =>
      factory.createImportSpecifier(false, undefined, factory.createIdentifier(importedFunctionName)),
    ),
  );
  const importStatement = ts.factory.createImportDeclaration(
    undefined,
    factory.createImportClause(false, undefined, factory.createNamedImports(importSpecifiers)),
    factory.createStringLiteral(importedPackageName),
  );
  const functionCall = factory.createCallExpression(backendFunctionIdentifier, undefined, [functionCallParameter]);
  const exportedVariable = factory.createVariableDeclaration(exportedVariableName, undefined, undefined, functionCall);

  const exportStatement = factory.createVariableStatement(
    [factory.createModifier(ts.SyntaxKind.ExportKeyword)],
    factory.createVariableDeclarationList([exportedVariable], ts.NodeFlags.Const),
  );
  return factory.createNodeArray([importStatement, ...(postImportStatements ?? []), exportStatement]);
}
