import ts from 'typescript';
export type ResourceTsParameters = {
  additionalImportedBackendIdentifiers?: Record<string, Set<string>>;
  backendFunctionConstruct: string;
  functionCallParameter: ts.ObjectLiteralExpression;
  exportedVariableName: ts.Identifier;
  postImportStatements?: ts.Node[];
  postExportStatements?: ts.Node[];
};
export declare function renderResourceTsFile({
  additionalImportedBackendIdentifiers,
  backendFunctionConstruct,
  functionCallParameter,
  exportedVariableName,
  postImportStatements,
  postExportStatements,
}: ResourceTsParameters): ts.NodeArray<ts.Node>;
export type ResourceTsParametersList = {
  additionalImportedBackendIdentifiers?: Record<string, Set<string>>;
  backendFunctionConstruct: string;
  functionCallParameter: ts.ObjectLiteralExpression[];
  exportedVariableName: ts.Identifier[];
  postImportStatements?: ts.Node[];
  postExportStatements?: ts.Node[];
};
export declare function renderResourceTsFilesForFunction({
  additionalImportedBackendIdentifiers,
  backendFunctionConstruct,
  functionCallParameter,
  exportedVariableName,
  postImportStatements,
  postExportStatements,
}: ResourceTsParametersList): ts.NodeArray<ts.Node>;
//# sourceMappingURL=resource.d.ts.map
