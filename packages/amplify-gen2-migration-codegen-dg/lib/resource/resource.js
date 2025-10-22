"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderResourceTsFilesForFunction = exports.renderResourceTsFile = void 0;
const typescript_1 = __importDefault(require("typescript"));
const ts_factory_utils_1 = require("../ts_factory_utils");
const factory = typescript_1.default.factory;
// Creates ts file with imports / exports
function renderResourceTsFile({ additionalImportedBackendIdentifiers = {}, backendFunctionConstruct, functionCallParameter, exportedVariableName, postImportStatements, postExportStatements, }) {
    const backendFunctionIdentifier = factory.createIdentifier(backendFunctionConstruct);
    const importStatements = renderImportStatements(additionalImportedBackendIdentifiers);
    const functionCall = factory.createCallExpression(backendFunctionIdentifier, undefined, [functionCallParameter]);
    const exportedVariable = factory.createVariableDeclaration(exportedVariableName, undefined, undefined, functionCall);
    const exportStatement = factory.createVariableStatement([factory.createModifier(typescript_1.default.SyntaxKind.ExportKeyword)], factory.createVariableDeclarationList([exportedVariable], typescript_1.default.NodeFlags.Const));
    return factory.createNodeArray([
        ...importStatements,
        ...(postImportStatements !== undefined && postImportStatements.length > 0 ? [ts_factory_utils_1.newLineIdentifier, ...postImportStatements] : []),
        ts_factory_utils_1.newLineIdentifier,
        exportStatement,
        ...(postExportStatements !== undefined && postExportStatements.length > 0 ? [ts_factory_utils_1.newLineIdentifier, ...postExportStatements] : []),
    ]);
}
exports.renderResourceTsFile = renderResourceTsFile;
function renderResourceTsFilesForFunction({ additionalImportedBackendIdentifiers = {}, backendFunctionConstruct, functionCallParameter, exportedVariableName, postImportStatements, postExportStatements, }) {
    const importStatements = renderImportStatements(additionalImportedBackendIdentifiers);
    const exportStatements = renderExportStatementsForFunctions(backendFunctionConstruct, functionCallParameter, exportedVariableName);
    return factory.createNodeArray([
        ...importStatements,
        ...(postImportStatements !== undefined && postImportStatements.length > 0 ? [ts_factory_utils_1.newLineIdentifier, ...postImportStatements] : []),
        ...(exportStatements ? [ts_factory_utils_1.newLineIdentifier, ...exportStatements] : []),
        ...(postExportStatements !== undefined && postExportStatements.length > 0 ? [ts_factory_utils_1.newLineIdentifier, ...postExportStatements] : []),
    ]);
}
exports.renderResourceTsFilesForFunction = renderResourceTsFilesForFunction;
function renderImportStatements(additionalImportedBackendIdentifiers) {
    const importStatements = [];
    for (const [packageName, identifiers] of Object.entries(additionalImportedBackendIdentifiers)) {
        const importSpecifiers = [];
        identifiers.forEach((identifier) => {
            importSpecifiers.push(factory.createImportSpecifier(false, undefined, factory.createIdentifier(identifier)));
        });
        const importStatement = factory.createImportDeclaration(undefined, factory.createImportClause(false, undefined, factory.createNamedImports(importSpecifiers)), factory.createStringLiteral(packageName));
        importStatements.push(importStatement);
    }
    return importStatements;
}
function renderExportStatementsForFunctions(backendFunctionConstruct, functionCallParameter, exportedVariableName) {
    const exportStatementList = [];
    let i = 0;
    for (const functionCallParam of functionCallParameter) {
        const backendFunctionIdentifier = factory.createIdentifier(backendFunctionConstruct);
        const functionCall = factory.createCallExpression(backendFunctionIdentifier, undefined, [functionCallParam]);
        const exportedVariable = factory.createVariableDeclaration(exportedVariableName[i], undefined, undefined, functionCall);
        const exportStatement = factory.createVariableStatement([factory.createModifier(typescript_1.default.SyntaxKind.ExportKeyword)], factory.createVariableDeclarationList([exportedVariable], typescript_1.default.NodeFlags.Const));
        exportStatementList.push(typescript_1.default.addSyntheticLeadingComment(exportStatement, typescript_1.default.SyntaxKind.MultiLineCommentTrivia, `\nSource code for this function can be found in your Amplify Gen 1 Directory.\nSee amplify/backend/function/${exportedVariableName[i].escapedText}/src \n`, true));
        i++;
    }
    return exportStatementList;
}
//# sourceMappingURL=resource.js.map