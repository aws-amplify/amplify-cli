type GSIType = {
  IndexName: string;
  KeySchema: [
    {
      AttributeName: string;
      KeyType: string;
    }
  ];
  Projection: {
    ProjectionType: 'ALL' | 'KEYS_ONLY' | 'INCLUDE';
  };
};
export async function ensureDynamoDBTables(dynamodb, config) {
  const tables = config.tables.map(t => t.Properties);
  const existingTables = await dynamodb.listTables().promise();
  await Promise.all(
    tables.map(async tableConfig => {
      const TableName = tableConfig.TableName;
      try {
        const tableExists = existingTables.TableNames.includes(TableName);
        if (tableExists) {
          const params = {
            TableName,
          };
          const existingTable = await dynamodb.describeTable(params).promise();
          // update GSIs
          const newGSIs: GSIType[] | undefined = tableConfig.GlobalSecondaryIndexes || [];
          const existingGSIs: GSIType[] | undefined =
            existingTable.Table.GlobalSecondaryIndexes || [];

          const existing = existingGSIs.filter(gsi =>
            newGSIs.map(gsi => gsi.IndexName).includes(gsi.IndexName)
          );
          const additions = newGSIs.filter(
            gsi => !existingGSIs.map(gsi => gsi.IndexName).includes(gsi.IndexName)
          );
          const deletions = existingGSIs.filter(
            gsi => !newGSIs.map(gsi => gsi.IndexName).includes(gsi.IndexName)
          );

          // create additions
          const Additions = additions.map(gsi => {
            console.info(`Creating GSI ${gsi.IndexName} for ${tableConfig.TableName} locally`);

            return {
              Create: {
                IndexName: gsi.IndexName,
                KeySchema: gsi.KeySchema,
                Projection: gsi.Projection,
                ProvisionedThroughput: {
                  ReadCapacityUnits: 0,
                  WriteCapacityUnits: 0,
                },
              },
            };
          });

          const Deletions = deletions.map(gsi => {
            console.info(`Deleting GSI ${gsi.IndexName} for ${tableConfig.TableName} locally`);

            return {
              Delete: {
                IndexName: gsi.IndexName,
              },
            };
          });

          let GlobalSecondaryIndexUpdates = [...Additions, ...Deletions];
          if (GlobalSecondaryIndexUpdates.length > 0) {
            const updates = GlobalSecondaryIndexUpdates.map(GSIUpdate => {
              return dynamodb
                .updateTable({
                  TableName,
                  AttributeDefinitions: existingTable.Table.AttributeDefinitions,
                  GlobalSecondaryIndexUpdates: [GSIUpdate],
                })
                .promise();
            });
            await Promise.all(updates);
          }
        } else {
          console.info(`Creating table ${tableConfig.TableName} locally`);
          await dynamodb.createTable(tableConfig).promise();
        }
      } catch (err) {
        // console.log('error', err);
        if (err.code !== 'ResourceInUseException') throw err;
      }
    })
  );
}

export function configureDDBDataSource(config, ddbConfig) {
  config.dataSources
    .filter(d => d.type === 'AMAZON_DYNAMODB')
    .forEach(d => {
      d.config.endpoint = ddbConfig.endpoint;
      d.config.region = ddbConfig.region;
      d.config.accessKeyId = ddbConfig.accessKeyId;
      d.config.secretAccessKey = ddbConfig.secretAccessKey;
    });
  return config;
}
