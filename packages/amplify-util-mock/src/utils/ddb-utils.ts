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
  const creationPromises = tablesToCreate.map(tableConfig =>
    dynamodb.createTable(tableConfig).promise()
  );

  // table updates
  const tablesToUpdate = tables.filter(table =>
    existingTables.TableNames.includes(table.TableName)
  );

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

  const gsiModifications = tablesToUpdateConfigs.map(({ Table: tableConfig }: { Table: any }) => {
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

    const Additions = additions.map(createAddition).map(GSIUpdate =>
      dynamodb
        .updateTable({
          TableName,
          AttributeDefinitions: existingTable.AttributeDefinitions,
          GlobalSecondaryIndexUpdates: [GSIUpdate],
        })
        .promise()
    );

    const deletions = existingGSIs.filter(
      gsi => !newGSIs.map(gsi => gsi.IndexName).includes(gsi.IndexName)
    );

    const Deletions = deletions.map(createDeletion).map(GSIUpdate =>
      dynamodb
        .updateTable({
          TableName,
          AttributeDefinitions: existingTable.AttributeDefinitions,
          GlobalSecondaryIndexUpdates: [GSIUpdate],
        })
        .promise()
    );

    return [...Additions, ...Deletions];
  });

  const allPromises = [
    ...creationPromises,
    ...gsiModifications.reduce((acc, cur) => [...acc, ...cur], []),
    [],
  ];

  try {
    allPromises
      .filter(item => item instanceof Promise)
      .reduce((promiseChain, currentTask) => {
        return promiseChain
          .then(chainResults => {
            return currentTask
              .then(currentResult => chainResults && [...chainResults, currentResult])
              .catch(err => {
                if (err.code !== 'ResourceInUseException') throw err;
              });
          })
          .catch(err => {
            if (err.code !== 'ResourceInUseException') throw err;
          });
      }, Promise.resolve([]))
      // .then(arrayOfResults => {
      //   console.log('arrayOfResults', arrayOfResults);
      //   // Do something with all results
      // })
      .catch(err => {
        if (err.code !== 'ResourceInUseException') throw err;
      });
  } catch (err) {
    // console.log('error', err);
    if (err.code !== 'ResourceInUseException') throw err;
  }
  // create promises
  // const tableOperations = tables.map(tableConfig => {
  //   const TableName = tableConfig.TableName;
  //   try {
  //     const tableExists = existingTables.TableNames.includes(TableName);
  //     if (tableExists) {
  //       const existingTable = dynamodb
  //         .describeTable({
  //           TableName,
  //         })
  //         .promise();
  //       // update GSIs
  //       const newGSIs: GSIType[] | undefined = tableConfig.GlobalSecondaryIndexes || [];
  //       const existingGSIs: GSIType[] | undefined =
  //         existingTable.Table.GlobalSecondaryIndexes || [];

  //       // const existing = existingGSIs.filter(gsi =>
  //       //   newGSIs.map(gsi => gsi.IndexName).includes(gsi.IndexName)
  //       // );
  //       const additions = newGSIs.filter(
  //         gsi => !existingGSIs.map(gsi => gsi.IndexName).includes(gsi.IndexName)
  //       );

  //       // create additions
  //       const Additions = additions.map(createAddition);

  //       const deletions = existingGSIs.filter(
  //         gsi => !newGSIs.map(gsi => gsi.IndexName).includes(gsi.IndexName)
  //       );

  //       const Deletions = deletions.map(createDeletion);

  //       let GlobalSecondaryIndexUpdates = [...Additions, ...Deletions];
  //       if (GlobalSecondaryIndexUpdates.length > 0) {
  //         await GlobalSecondaryIndexUpdates.reduce((acc, GSIUpdate) => {
  //           return acc.then(() =>
  //             dynamodb
  //               .updateTable({
  //                 TableName,
  //                 AttributeDefinitions: existingTable.Table.AttributeDefinitions,
  //                 GlobalSecondaryIndexUpdates: [GSIUpdate],
  //               })
  //               .promise()
  //           );
  //         }, Promise.resolve(null));
  //       }
  //     } else {
  //       console.info(`Creating table ${tableConfig.TableName} locally`);
  //       return dynamodb.createTable(tableConfig).promise();
  //     }
  //   } catch (error) {}
  // });

  // await tables.reduce((acc, tableConfig) => {
  //   return acc.then(async () => {
  //     const TableName = tableConfig.TableName;
  //     try {
  //       const tableExists = existingTables.TableNames.includes(TableName);
  //       if (tableExists) {
  //         const params = {
  //           TableName,
  //         };
  //         const existingTable = await dynamodb.describeTable(params).promise();
  //         // update GSIs
  //         const newGSIs: GSIType[] | undefined = tableConfig.GlobalSecondaryIndexes || [];
  //         const existingGSIs: GSIType[] | undefined =
  //           existingTable.Table.GlobalSecondaryIndexes || [];

  //         // const existing = existingGSIs.filter(gsi =>
  //         //   newGSIs.map(gsi => gsi.IndexName).includes(gsi.IndexName)
  //         // );
  //         const additions = newGSIs.filter(
  //           gsi => !existingGSIs.map(gsi => gsi.IndexName).includes(gsi.IndexName)
  //         );

  //         // create additions
  //         const Additions = additions.map(createAddition);

  //         const deletions = existingGSIs.filter(
  //           gsi => !newGSIs.map(gsi => gsi.IndexName).includes(gsi.IndexName)
  //         );

  //         const Deletions = deletions.map(createDeletion);

  //         let GlobalSecondaryIndexUpdates = [...Additions, ...Deletions];
  //         if (GlobalSecondaryIndexUpdates.length > 0) {
  //           await GlobalSecondaryIndexUpdates.reduce((acc, GSIUpdate) => {
  //             return acc.then(() =>
  //               dynamodb
  //                 .updateTable({
  //                   TableName,
  //                   AttributeDefinitions: existingTable.Table.AttributeDefinitions,
  //                   GlobalSecondaryIndexUpdates: [GSIUpdate],
  //                 })
  //                 .promise()
  //             );
  //           }, Promise.resolve(null));
  //         }
  //       } else {
  //         console.info(`Creating table ${tableConfig.TableName} locally`);
  //         await dynamodb.createTable(tableConfig).promise();
  //       }
  //     } catch (err) {
  //       console.log('error', err);
  //       if (err.code !== 'ResourceInUseException') throw err;
  //     }
  //   });
  // }, Promise.resolve(null));
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
