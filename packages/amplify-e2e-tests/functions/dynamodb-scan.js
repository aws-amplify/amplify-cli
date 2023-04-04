const { DynamoDBClient, ScanCommand } = require('@aws-sdk/client-dynamodb');
const ddbClient = new DynamoDBClient({ region: process.env.AWS_REGION });

exports.handler = async (event) => {
  return await ddbClient.send(new ScanCommand({ TableName: event.tableName }));
};
