export async function ensureDynamoDBTables(dynamodb, config) {
  const tables = config.tables.map(t => t.Properties);
  return await Promise.all(
    tables.map(async resource => {
      try {
        console.info(`Creating table ${resource.TableName} locally`);
        await dynamodb.createTable(resource).promise();
      } catch (err) {
        if (err.code !== 'ResourceInUseException') throw err;
      }
    })
  );
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
