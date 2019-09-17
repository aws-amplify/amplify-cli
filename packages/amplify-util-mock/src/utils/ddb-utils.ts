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

const createAddition = (
  gsi: GSIType
) => /* console.info(`Creating GSI ${gsi.IndexName} for ${tableConfig.TableName} locally`);*/ ({
  Create: {
    IndexName: gsi.IndexName,
    KeySchema: gsi.KeySchema,
    Projection: gsi.Projection,
    ProvisionedThroughput: {
      ReadCapacityUnits: 0,
      WriteCapacityUnits: 0,
    },
  },
});

const createDeletion = (
  gsi: GSIType
) => /* console.info(`Deleting GSI ${gsi.IndexName} for ${tableConfig.TableName} locally`);*/ ({
  Delete: {
    IndexName: gsi.IndexName,
  },
});

export async function ensureDynamoDBTables(dynamodb, config) {
  const tables = config.tables.map(t => t.Properties);
  const existingTables = await dynamodb.listTables().promise();

  // table creations
  const tablesToCreate = tables.filter(
    table => !existingTables.TableNames.includes(table.TableName)
  );
  const creationPromises: Promise<any>[] = tablesToCreate.map(tableConfig => {
    console.info(`Will CREATE table ${tableConfig.TableName} locally`);

    return dynamodb.createTable(tableConfig).promise();
  });

  // table updates
  const tablesToUpdate = tables.filter(table => {
    // console.info(`Will UPDATE table ${table.TableName} locally`);

    return existingTables.TableNames.includes(table.TableName);
  });

  const tablesToUpdateConfigs = await Promise.all(
    tablesToUpdate.map(tableConfig => {
      const TableName = tableConfig.TableName;

      return dynamodb
        .describeTable({
          TableName,
        })
        .promise();
    })
  );

  const gsiModifications: Promise<any>[] = tablesToUpdateConfigs.map(
    ({ Table: tableConfig }: { Table: any }) => {
      const TableName = tableConfig.TableName;

      const existingGSIs: GSIType[] | undefined = tableConfig.GlobalSecondaryIndexes || [];
      const existingTable = tables.filter(table => table.TableName === TableName)[0];

      if (!existingTable) return undefined;

      const newGSIs: GSIType[] | undefined = existingTable.GlobalSecondaryIndexes || [];

      const existing = existingGSIs.filter(gsi =>
        newGSIs.map(gsi => gsi.IndexName).includes(gsi.IndexName)
      );

      const additions = newGSIs.filter(
        gsi => !existingGSIs.map(gsi => gsi.IndexName).includes(gsi.IndexName)
      );

      const Additions = additions.map(createAddition).map(GSIUpdate => {
        console.info(
          `Will ADD GSI ${GSIUpdate.Create.IndexName} for table ${tableConfig.TableName} locally`
        );

        return dynamodb
          .updateTable({
            TableName,
            AttributeDefinitions: existingTable.AttributeDefinitions,
            GlobalSecondaryIndexUpdates: [GSIUpdate],
          })
          .promise();
      });

      const deletions = existingGSIs.filter(
        gsi => !newGSIs.map(gsi => gsi.IndexName).includes(gsi.IndexName)
      );

      const Deletions = deletions.map(createDeletion).map(GSIUpdate => {
        console.info(
          `Will DELETE GSI ${GSIUpdate.Delete.IndexName} for table ${tableConfig.TableName} locally`
        );

        return dynamodb
          .updateTable({
            TableName,
            AttributeDefinitions: existingTable.AttributeDefinitions,
            GlobalSecondaryIndexUpdates: [GSIUpdate],
          })
          .promise();
      });

      const operations = [...Additions, ...Deletions];
      return operations.reduce(
        (acc, cur) => (cur instanceof Array ? [...acc, ...cur] : [...acc, cur]),
        []
      );
    }
  );

  const tableOperations = [...creationPromises, ...gsiModifications];

  try {
    for (const operation of tableOperations) {
      await operation;
    }
    // await tableOperations
    //   .filter((item: any) => item instanceof Promise)
    //   .reduce(async (_total, job) => {
    //     await job();
    //   }, Promise.resolve([]));
  } catch (err) {
    if (err.code !== 'ResourceInUseException') throw err;
    console.log('err', err);
  }
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
