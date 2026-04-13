const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand } = require('@aws-sdk/lib-dynamodb');

const dynamoDB = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE_NAME = process.env.STORAGE_ACTIVITY_NAME;

exports.handler = async (event) => {
  console.log(`EVENT: ${JSON.stringify(event)}`);

  const { storage.bookmarks.PartitionKeyName } = event.arguments;
  return await fetchUserActivity(storage.bookmarks.PartitionKeyName);

};

async function fetchUserActivity(storage.bookmarks.PartitionKeyName) {

  const result = await dynamoDB.send(new QueryCommand({
    TableName: TABLE_NAME,
    IndexName: 'byUserId',
    KeyConditionExpression: 'storage.bookmarks.PartitionKeyName = :storage.bookmarks.PartitionKeyName',
    ExpressionAttributeValues: { ':storage.bookmarks.PartitionKeyName': storage.bookmarks.PartitionKeyName },
    ScanIndexForward: false,
    Limit: 50
  }));

  return result.Items;

}
