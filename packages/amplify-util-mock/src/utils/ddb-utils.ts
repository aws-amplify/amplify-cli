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
