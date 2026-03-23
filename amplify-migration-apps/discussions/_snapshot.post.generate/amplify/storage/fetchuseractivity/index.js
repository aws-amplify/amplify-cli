const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand } = require('@aws-sdk/lib-dynamodb');

const dynamoDB = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE_NAME = process.env.STORAGE_ACTIVITY_NAME;

exports.handler = async (event) => {
  console.log(`EVENT: ${JSON.stringify(event)}`);

  const { userId } = event.arguments;
  return await fetchUserActivity(userId);

};

async function fetchUserActivity(userId) {

  const result = await dynamoDB.send(new QueryCommand({
    TableName: TABLE_NAME,
    IndexName: 'byUserId',
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: { ':userId': userId },
    ScanIndexForward: false,
    Limit: 50
  }));

  return result.Items;

}
