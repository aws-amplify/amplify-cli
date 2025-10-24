'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.generateDataSource = void 0;
const typescript_1 = __importDefault(require('typescript'));
const resource_1 = require('../../resource/resource');
const factory = typescript_1.default.factory;
const migratedAmplifyGen1DynamoDbTableMappingsKeyName = 'migratedAmplifyGen1DynamoDbTableMappings';
const generateDataSource = (dataDefinition) => {
  const dataRenderProperties = [];
  const namedImports = { '@aws-amplify/backend': new Set() };
  namedImports['@aws-amplify/backend'].add('defineData');
  const schemaStatements = [];
  if (dataDefinition && dataDefinition.schema) {
    const schemaVariableDeclaration = factory.createVariableDeclaration(
      'schema',
      undefined,
      undefined,
      factory.createNoSubstitutionTemplateLiteral(dataDefinition.schema),
    );
    const schemaStatementAssignment = factory.createVariableStatement(
      [],
      factory.createVariableDeclarationList([schemaVariableDeclaration], typescript_1.default.NodeFlags.Const),
    );
    schemaStatements.push(schemaStatementAssignment);
  }
  if (dataDefinition === null || dataDefinition === void 0 ? void 0 : dataDefinition.tableMappings) {
    const tableMappingEnvironments = [];
    for (const [environmentName, tableMapping] of Object.entries(dataDefinition.tableMappings)) {
      const tableMappingProperties = [];
      if (tableMapping) {
        for (const [tableName, tableId] of Object.entries(tableMapping)) {
          tableMappingProperties.push(
            factory.createPropertyAssignment(factory.createIdentifier(tableName), factory.createStringLiteral(tableId)),
          );
        }
      }
      const branchNameExpression = typescript_1.default.addSyntheticLeadingComment(
        factory.createPropertyAssignment('branchName', factory.createStringLiteral(environmentName)),
        typescript_1.default.SyntaxKind.SingleLineCommentTrivia,
        ` Replace the environment name (${environmentName}) with the corresponding branch name. Use "sandbox" for your sandbox environment.`,
        true,
      );
      let tableMappingExpression = factory.createPropertyAssignment(
        'modelNameToTableNameMapping',
        factory.createObjectLiteralExpression(tableMappingProperties),
      );
      if (tableMappingProperties.length === 0) {
        tableMappingExpression = typescript_1.default.addSyntheticLeadingComment(
          tableMappingExpression,
          typescript_1.default.SyntaxKind.MultiLineCommentTrivia,
          '*\n' +
            '* Unable to find the table mapping for this environment.\n' +
            '* This could be due the enableGen2Migration feature flag not being set to true for this environment.\n' +
            '* Please enable the feature flag and push the backend resources.\n' +
            '* If you are not planning to migrate this environment, you can remove this key.\n',
          true,
        );
      }
      const tableMappingForEnvironment = factory.createObjectLiteralExpression([branchNameExpression, tableMappingExpression], true);
      tableMappingEnvironments.push(tableMappingForEnvironment);
    }
    dataRenderProperties.push(
      factory.createPropertyAssignment(
        migratedAmplifyGen1DynamoDbTableMappingsKeyName,
        factory.createArrayLiteralExpression(tableMappingEnvironments),
      ),
    );
  }
  dataRenderProperties.push(factory.createShorthandPropertyAssignment(factory.createIdentifier('schema')));
  return (0, resource_1.renderResourceTsFile)({
    exportedVariableName: factory.createIdentifier('data'),
    functionCallParameter: factory.createObjectLiteralExpression(dataRenderProperties, true),
    backendFunctionConstruct: 'defineData',
    postImportStatements: schemaStatements,
    additionalImportedBackendIdentifiers: namedImports,
  });
};
exports.generateDataSource = generateDataSource;
//# sourceMappingURL=index.js.map
