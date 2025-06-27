const { DynamoDBClient, ScanCommand } = require('@aws-sdk/client-dynamodb');
const DDB = new DynamoDBClient();

exports.handler = async (event) => {
  const command = new ScanCommand({ TableName: event.tableName });
  return await DDB.send(command);
};
