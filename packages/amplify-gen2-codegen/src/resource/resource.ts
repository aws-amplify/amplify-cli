import ts from 'typescript';
const factory = ts.factory;
export type ResourceTsParameters = {
  additionalImportedBackendIdentifiers?: string[];
  importedPackageName: string;
  backendFunctionConstruct: string;
  functionCallParameter: ts.ObjectLiteralExpression;
  exportedVariableName: ts.Identifier;
  postImportStatements?: ts.Node[];
  postExportStatements?: ts.Node[];
};
export function renderResourceTsFile({
  additionalImportedBackendIdentifiers = [],
  backendFunctionConstruct,
  importedPackageName,
  functionCallParameter,
  exportedVariableName,
  postImportStatements,
  postExportStatements,
}: ResourceTsParameters): ts.NodeArray<ts.Node> {
  const backendFunctionIdentifier = factory.createIdentifier(backendFunctionConstruct);
  const importStatement = renderImportStatements(backendFunctionIdentifier, additionalImportedBackendIdentifiers, importedPackageName);
  const functionCall = factory.createCallExpression(backendFunctionIdentifier, undefined, [functionCallParameter]);
  const exportedVariable = factory.createVariableDeclaration(exportedVariableName, undefined, undefined, functionCall);
  const exportStatement = factory.createVariableStatement(
    [factory.createModifier(ts.SyntaxKind.ExportKeyword)],
    factory.createVariableDeclarationList([exportedVariable], ts.NodeFlags.Const),
  );

  return factory.createNodeArray([importStatement, ...(postImportStatements ?? []), exportStatement, ...(postExportStatements ?? [])]);
}

export type ResourceTsParametersList = {
  additionalImportedBackendIdentifiers?: string[];
  importedPackageName: string;
  backendFunctionConstruct: string;
  functionCallParameter: ts.ObjectLiteralExpression[];
  exportedVariableName: ts.Identifier[];
  postImportStatements?: ts.Node[];
  postExportStatements?: ts.Node[];
};

export function renderResourceTsFilesForFunction({
  additionalImportedBackendIdentifiers = [],
  backendFunctionConstruct,
  importedPackageName,
  functionCallParameter,
  exportedVariableName,
  postImportStatements,
  postExportStatements,
}: ResourceTsParametersList): ts.NodeArray<ts.Node> {
  const backendFunctionIdentifier = factory.createIdentifier(backendFunctionConstruct);

  const importStatement = renderImportStatements(backendFunctionIdentifier, additionalImportedBackendIdentifiers, importedPackageName);
  const exportStatements = renderExportStatementsForFunctions(backendFunctionConstruct, functionCallParameter, exportedVariableName);

  return factory.createNodeArray([
    importStatement,
    ...(postImportStatements ?? []),
    ...(exportStatements ?? []),
    ...(postExportStatements ?? []),
  ]);
}

function renderImportStatements(
  backendFunctionIdentifier: ts.Identifier,
  additionalImportedBackendIdentifiers: string[],
  importedPackageName: string,
) {
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

  return importStatement;
}

function renderExportStatementsForFunctions(
  backendFunctionConstruct: string,
  functionCallParameter: ts.ObjectLiteralExpression[],
  exportedVariableName: ts.Identifier[],
) {
  const exportStatementList: ts.VariableStatement[] = [];
  let i = 0;
  for (const functionCallParam of functionCallParameter) {
    const backendFunctionIdentifier = factory.createIdentifier(backendFunctionConstruct);
    const functionCall = factory.createCallExpression(backendFunctionIdentifier, undefined, [functionCallParam]);
    const exportedVariable = factory.createVariableDeclaration(exportedVariableName[i], undefined, undefined, functionCall);
    const exportStatement = factory.createVariableStatement(
      [factory.createModifier(ts.SyntaxKind.ExportKeyword)],
      factory.createVariableDeclarationList([exportedVariable], ts.NodeFlags.Const),
    );
    exportStatementList.push(
      ts.addSyntheticLeadingComment(
        exportStatement,
        ts.SyntaxKind.MultiLineCommentTrivia,
        `\nSource code for this function can be found in your Amplify Gen 1 Directory.\nSee amplify/backend/function/${exportedVariableName[i].escapedText}/src \n`,
        true,
      ),
    );
    i++;
  }

  return exportStatementList;
}
