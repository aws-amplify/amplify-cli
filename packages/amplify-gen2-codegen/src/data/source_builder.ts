import ts, { ObjectLiteralElementLike } from 'typescript';
import { renderResourceTsFile } from '../resource/resource';
const factory = ts.factory;

export type DataDefinition = {
  tableMapping: Record<string, string>;
};

const importedAmplifyDynamoDBTableMapKeyName = 'importedAmplifyDynamoDBTableMap';
const importedModelsKey = 'importedModels';

export const generateDataSource = (dataDefinition?: DataDefinition): ts.NodeArray<ts.Node> => {
  const dataRenderProperties: ObjectLiteralElementLike[] = [];

  if (dataDefinition?.tableMapping) {
    const tableMappingProperties: ObjectLiteralElementLike[] = [];
    for (const [tableName, tableId] of Object.entries(dataDefinition.tableMapping)) {
      tableMappingProperties.push(
        factory.createPropertyAssignment(factory.createIdentifier(tableName), factory.createStringLiteral(tableId)),
      );
      tableMappingProperties.push(
        factory.createPropertyAssignment(
          factory.createIdentifier(importedModelsKey),
          factory.createArrayLiteralExpression(
            Object.keys(dataDefinition.tableMapping).map((tableName) => factory.createStringLiteral(tableName)),
          ),
        ),
      );
    }
    dataRenderProperties.push(
      factory.createPropertyAssignment(
        importedAmplifyDynamoDBTableMapKeyName,
        factory.createObjectLiteralExpression(tableMappingProperties),
      ),
    );
  }
  return renderResourceTsFile({
    exportedVariableName: factory.createIdentifier('data'),
    functionCallParameter: factory.createObjectLiteralExpression(dataRenderProperties, true),
    backendFunctionConstruct: 'defineData',
    importedPackageName: '@aws-amplify/backend',
  });
};
