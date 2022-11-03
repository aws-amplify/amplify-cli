import { DynamoDB } from 'aws-sdk';
import { CreateTableInput, GlobalSecondaryIndexUpdate, TableDescription, UpdateTableInput } from 'aws-sdk/clients/dynamodb';
import { waitTillTableStateIsActive } from './helpers';

export async function createTables(dynamoDbClient: DynamoDB, tables: CreateTableInput[]): Promise<void> {
  for (let table of tables) {
    console.log(`Creating new table ${table.TableName}`);
    await dynamoDbClient.createTable(table).promise();
  }
}

export async function updateTables(dynamoDbClient: DynamoDB, tables: UpdateTableInput[]): Promise<void> {
  for (let table of tables) {
    const updateType = table.GlobalSecondaryIndexUpdates[0].Delete ? 'Deleting' : 'Creating';
    const indexName =
      updateType == 'Deleting'
        ? table.GlobalSecondaryIndexUpdates[0].Delete.IndexName
        : table.GlobalSecondaryIndexUpdates[0].Create.IndexName;
    await waitTillTableStateIsActive(dynamoDbClient, table.TableName);
    console.log(`${updateType} index ${indexName} on ${table.TableName}`);
    await dynamoDbClient.updateTable(table).promise();
  }
}

export async function describeTables(dynamoDbClient: DynamoDB, tableNames: string[]): Promise<Record<string, TableDescription>> {
  const tableDetails: Record<string, TableDescription> = {};
  for (let tableName of tableNames) {
    const tableDescription = await dynamoDbClient.describeTable({ TableName: tableName }).promise();
    if (tableDescription.Table) {
      tableDetails[tableName] = tableDescription.Table;
    }
  }
  return tableDetails;
}

export function getUpdateTableInput(createInput: CreateTableInput, existingTableConfig: TableDescription): UpdateTableInput[] {
  if (createInput.TableName !== existingTableConfig.TableName) {
    throw new Error('Invalid input, table name mismatch');
  }
  const inputGSINames = (createInput.GlobalSecondaryIndexes || []).map(index => index.IndexName);
  const existingGSINames = (existingTableConfig.GlobalSecondaryIndexes || []).map(index => index.IndexName);
  const indexNamesToAdd = inputGSINames.filter(indexName => !existingGSINames.includes(indexName));
  const indexNamesToRemove = existingGSINames.filter(indexName => !inputGSINames.includes(indexName));

  const indicesToAdd: GlobalSecondaryIndexUpdate[] = indexNamesToAdd.map(indexName => {
    const idx = createInput.GlobalSecondaryIndexes.find(index => index.IndexName === indexName);
    return {
      Create: idx,
    };
  });
  const indicesToRemove: GlobalSecondaryIndexUpdate[] = indexNamesToRemove.map(indexName => {
    return {
      Delete: {
        IndexName: indexName,
      },
    };
  });

  return [
    ...(indicesToRemove.length
      ? indicesToRemove.map(index => {
          return {
            TableName: existingTableConfig.TableName,
            GlobalSecondaryIndexUpdates: [index],
          };
        })
      : []),
    ...(indicesToAdd.length
      ? indicesToAdd.map(index => {
          return {
            TableName: existingTableConfig.TableName,
            AttributeDefinitions: createInput.AttributeDefinitions,
            GlobalSecondaryIndexUpdates: [index],
          };
        })
      : []),
  ];
}
