import { DynamoDB } from 'aws-sdk';
import { createTables, describeTables, getUpdateTableInput, updateTables } from './utils';
import { CreateTableInput } from 'aws-sdk/clients/dynamodb';

export type MockDynamoDBConfig = {
  tables: { Properties: CreateTableInput }[];
};

export async function createAndUpdateTable(dynamoDbClient: DynamoDB, config: MockDynamoDBConfig): Promise<void> {
  const tables = config.tables.map(table => table.Properties);
  const existingTables = await dynamoDbClient.listTables().promise();
  const existingTablesWithDetails = await describeTables(dynamoDbClient, existingTables.TableNames);
  const tablesToCreate = tables.filter(t => {
    const tableName = t.TableName;
    return !existingTables.TableNames.includes(tableName);
  });

  const tablesToUpdate = tables.filter(t => {
    const tableName = t.TableName;
    return existingTables.TableNames.includes(tableName);
  });
  await createTables(dynamoDbClient, tablesToCreate);
  const updateTableInputs = tablesToUpdate.reduce((acc, createTableInput) => {
    const existingTableDetail = existingTablesWithDetails[createTableInput.TableName];
    return [...acc, ...getUpdateTableInput(createTableInput, existingTableDetail)];
  }, []);
  await updateTables(dynamoDbClient, updateTableInputs);
}

export function configureDDBDataSource(config, ddbConfig) {
  return {
    ...config,
    dataSources: config.dataSources.map(d => {
      if (d.type !== 'AMAZON_DYNAMODB') {
        return d;
      }
      return {
        ...d,
        config: {
          ...d.config,
          endpoint: ddbConfig.endpoint,
          region: ddbConfig.region,
          accessKeyId: ddbConfig.accessKeyId,
          secretAccessKey: ddbConfig.secretAccessKey,
        },
      };
    }),
  };
}
