import ts, { ObjectLiteralElementLike, ObjectLiteralExpression } from 'typescript';
import { renderResourceTsFile } from '../../resource/resource';
const factory = ts.factory;

/**
 * Maps model names to their corresponding DynamoDB table names for a specific environment.
 * Key: GraphQL model name, Value: DynamoDB table name/ID
 */
export type DataTableMapping = Record<string, string>;

/**
 * Configuration for generating Amplify Gen 2 data resources from Gen 1 projects.
 */
export type DataDefinition = {
  /** Environment-specific table mappings for preserving existing DynamoDB tables */
  tableMappings: Record<string, DataTableMapping | undefined>;
  /** GraphQL schema definition as a string */
  schema: string;
};

/** Key name for the migrated table mappings property in the generated data resource */
const migratedAmplifyGen1DynamoDbTableMappingsKeyName = 'migratedAmplifyGen1DynamoDbTableMappings';

/**
 * Generates TypeScript AST nodes for an Amplify Gen 2 data resource configuration.
 *
 * This function creates the necessary code structure for migrating Amplify Gen 1 GraphQL APIs
 * to Gen 2, preserving existing DynamoDB table mappings to avoid data loss during migration.
 *
 * @param dataDefinition - Optional configuration containing schema and table mappings
 * @returns TypeScript AST nodes representing the complete data resource file
 *
 * @example
 * ```typescript
 * const dataDefinition = {
 *   schema: `type Todo @model { id: ID! content: String! }`,
 *   tableMappings: {
 *     'dev': { 'Todo': 'TodoTable-abc123' },
 *     'prod': { 'Todo': 'TodoTable-xyz789' }
 *   }
 * };
 * const nodes = generateDataSource(dataDefinition);
 * ```
 */
export const generateDataSource = (dataDefinition?: DataDefinition): ts.NodeArray<ts.Node> => {
  // Properties for the defineData() function call
  const dataRenderProperties: ObjectLiteralElementLike[] = [];

  // Track required imports for the generated file
  const namedImports: Record<string, Set<string>> = { '@aws-amplify/backend': new Set() };
  namedImports['@aws-amplify/backend'].add('defineData');

  // Additional statements to include before the data export
  const schemaStatements: ts.Node[] = [];

  // Generate schema variable declaration if schema is provided
  if (dataDefinition && dataDefinition.schema) {
    const schemaVariableDeclaration = factory.createVariableDeclaration(
      'schema',
      undefined,
      undefined,
      factory.createNoSubstitutionTemplateLiteral(dataDefinition.schema),
    );
    const schemaStatementAssignment = factory.createVariableStatement(
      [],
      factory.createVariableDeclarationList([schemaVariableDeclaration], ts.NodeFlags.Const),
    );
    schemaStatements.push(schemaStatementAssignment);
  }

  // Generate table mappings for preserving existing DynamoDB tables during migration
  if (dataDefinition?.tableMappings) {
    const tableMappingEnvironments: ObjectLiteralExpression[] = [];

    // Process each environment's table mappings
    for (const [environmentName, tableMapping] of Object.entries(dataDefinition.tableMappings)) {
      const tableMappingProperties: ObjectLiteralElementLike[] = [];

      // Create model-to-table mappings for this environment
      if (tableMapping) {
        for (const [tableName, tableId] of Object.entries(tableMapping)) {
          tableMappingProperties.push(
            factory.createPropertyAssignment(factory.createIdentifier(tableName), factory.createStringLiteral(tableId)),
          );
        }
      }

      const branchNameExpression = ts.addSyntheticLeadingComment(
        factory.createPropertyAssignment('branchName', factory.createStringLiteral(environmentName)),
        ts.SyntaxKind.SingleLineCommentTrivia,
        ` Replace the environment name (${environmentName}) with the corresponding branch name. Use "sandbox" for your sandbox environment.`,
        true,
      );
      let tableMappingExpression = factory.createPropertyAssignment(
        'modelNameToTableNameMapping',
        factory.createObjectLiteralExpression(tableMappingProperties),
      );
      if (tableMappingProperties.length === 0) {
        tableMappingExpression = ts.addSyntheticLeadingComment(
          tableMappingExpression,
          ts.SyntaxKind.MultiLineCommentTrivia,
          '*\n' +
            '* Unable to find the table mapping for this environment.\n' +
            '* This may indicate the environment was deployed with an older Amplify CLI version.\n' +
            '* Try redeploying with "amplify push" to generate the table mappings.\n' +
            '* If you are not planning to migrate this environment, you can remove this entry.\n',
          true,
        );
      }
      // Combine branch name and table mappings for this environment
      const tableMappingForEnvironment = factory.createObjectLiteralExpression([branchNameExpression, tableMappingExpression], true);
      tableMappingEnvironments.push(tableMappingForEnvironment);
    }

    // Add the complete table mappings array to the data configuration
    dataRenderProperties.push(
      factory.createPropertyAssignment(
        migratedAmplifyGen1DynamoDbTableMappingsKeyName,
        factory.createArrayLiteralExpression(tableMappingEnvironments),
      ),
    );
  }

  // Add schema reference to the data configuration
  dataRenderProperties.push(factory.createShorthandPropertyAssignment(factory.createIdentifier('schema')));

  // Generate the complete TypeScript file with imports, schema, and data export
  return renderResourceTsFile({
    exportedVariableName: factory.createIdentifier('data'),
    functionCallParameter: factory.createObjectLiteralExpression(dataRenderProperties, true),
    backendFunctionConstruct: 'defineData',
    postImportStatements: schemaStatements,
    additionalImportedBackendIdentifiers: namedImports,
  });
};
