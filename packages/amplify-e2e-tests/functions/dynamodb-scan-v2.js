const { DynamoDBClient, ScanCommand } = require('@aws-sdk/client-dynamodb');
const client = new DynamoDBClient();

exports.handler = async (event) => {
  return await client.send(new ScanCommand({ TableName: event.tableName }));
};
