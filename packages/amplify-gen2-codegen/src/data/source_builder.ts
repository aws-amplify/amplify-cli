import ts, { ObjectLiteralElementLike } from 'typescript';
import { renderResourceTsFile } from '../resource/resource';
import { createTodoError } from '../todo_error';
const factory = ts.factory;

export type DataTableMapping = Record<string, string>;
export type DataDefinition = {
  tableMappings: Record<string, DataTableMapping | undefined>;
};

const importedAmplifyDynamoDBTableMapKeyName = 'importedAmplifyDynamoDBTableMap';

export const schemaPlaceholderComment = 'TODO: Add your existing graphql schema here';

export const generateDataSource = (dataDefinition?: DataDefinition): ts.NodeArray<ts.Node> => {
  const dataRenderProperties: ObjectLiteralElementLike[] = [];
  const namedImports: Record<string, Set<string>> = { '@aws-amplify/backend': new Set() };
  namedImports['@aws-amplify/backend'].add('defineData');

  if (dataDefinition?.tableMappings) {
    const tableMappingEnvironments: ObjectLiteralElementLike[] = [];
    for (const [environmentName, tableMapping] of Object.entries(dataDefinition.tableMappings)) {
      const tableMappingProperties: ObjectLiteralElementLike[] = [];
      if (tableMapping) {
        for (const [tableName, tableId] of Object.entries(tableMapping)) {
          tableMappingProperties.push(
            factory.createPropertyAssignment(factory.createIdentifier(tableName), factory.createStringLiteral(tableId)),
          );
        }
      }

      let tableMappingExpression = factory.createObjectLiteralExpression(tableMappingProperties);
      if (tableMappingProperties.length === 0) {
        tableMappingExpression = ts.addSyntheticLeadingComment(
          ts.addSyntheticLeadingComment(tableMappingExpression, ts.SyntaxKind.SingleLineCommentTrivia, '', true),
          ts.SyntaxKind.MultiLineCommentTrivia,
          ' Unable to find the table mapping for this environment.\n' +
            ' This could be due the enableGen2Migration feature flag not being set to true for this environment.\n' +
            ' Please enable the feature flag and push the backend resources.\n' +
            ' If you are not planning to migrate this environment, you can remove this key.',
          true,
        );
      }
      tableMappingEnvironments.push(factory.createPropertyAssignment(factory.createIdentifier(environmentName), tableMappingExpression));
    }
    dataRenderProperties.push(
      ts.addSyntheticLeadingComment(
        factory.createPropertyAssignment(
          importedAmplifyDynamoDBTableMapKeyName,
          factory.createObjectLiteralExpression(tableMappingEnvironments),
        ),
        ts.SyntaxKind.SingleLineCommentTrivia,
        ` Replace each environment name with the corresponding branch name. Use "sandbox" for your sandbox environment.`,
        true,
      ),
    );
  }
  dataRenderProperties.push(
    factory.createPropertyAssignment(factory.createIdentifier('schema'), factory.createStringLiteral(schemaPlaceholderComment)),
  );
  return renderResourceTsFile({
    exportedVariableName: factory.createIdentifier('data'),
    functionCallParameter: factory.createObjectLiteralExpression(dataRenderProperties, true),
    postExportStatements: [createTodoError('Add Gen 1 GraphQL schema')],
    backendFunctionConstruct: 'defineData',
    additionalImportedBackendIdentifiers: namedImports,
  });
};
