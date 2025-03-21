import ts from 'typescript';
import { newLineIdentifier } from '../ts_factory_utils';
const factory = ts.factory;
export type ResourceTsParameters = {
  additionalImportedBackendIdentifiers?: Record<string, Set<string>>;
  backendFunctionConstruct: string;
  functionCallParameter: ts.ObjectLiteralExpression;
  exportedVariableName: ts.Identifier;
  postImportStatements?: ts.Node[];
  postExportStatements?: ts.Node[];
};
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

export type ResourceTsParametersList = {
  additionalImportedBackendIdentifiers?: Record<string, Set<string>>;
  backendFunctionConstruct: string;
  functionCallParameter: ts.ObjectLiteralExpression[];
  exportedVariableName: ts.Identifier[];
  postImportStatements?: ts.Node[];
  postExportStatements?: ts.Node[];
};

export function renderResourceTsFilesForFunction({
  additionalImportedBackendIdentifiers = {},
  backendFunctionConstruct,
  functionCallParameter,
  exportedVariableName,
  postImportStatements,
  postExportStatements,
}: ResourceTsParametersList): ts.NodeArray<ts.Node> {
  const importStatements = renderImportStatements(additionalImportedBackendIdentifiers);
  const exportStatements = renderExportStatementsForFunctions(backendFunctionConstruct, functionCallParameter, exportedVariableName);

  return factory.createNodeArray([
    ...importStatements,
    ...(postImportStatements !== undefined && postImportStatements.length > 0 ? [newLineIdentifier, ...postImportStatements] : []),
    ...(exportStatements ? [newLineIdentifier, ...exportStatements] : []),
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
