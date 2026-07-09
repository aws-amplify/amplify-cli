/* Amplify Params - DO NOT EDIT
	ENV
	REGION
	STORAGE_ACTIVITY_ARN
	STORAGE_ACTIVITY_NAME
	STORAGE_ACTIVITY_STREAMARN
Amplify Params - DO NOT EDIT */

const { DynamoDBClient, UpdateItemCommand } = require('@aws-sdk/client-dynamodb');

const client = new DynamoDBClient();
const TABLE_NAME = process.env.STORAGE_ACTIVITY_NAME;

exports.handler = async (event) => {
  let newRecordCount = 0;

  for (const record of event.Records) {
    // Skip counter updates to avoid infinite loop
    const keys = record.dynamodb.Keys;
    if (keys.id.S.startsWith('STATS#')) continue;

    if (record.eventName === 'INSERT') {
      newRecordCount++;
    }
  }

  if (newRecordCount === 0) return;

  await client.send(
    new UpdateItemCommand({
      TableName: TABLE_NAME,
      Key: {
        id: { S: 'STATS#global' },
        userId: { S: 'COUNTER' },
      },
      UpdateExpression: 'ADD activityCount :inc',
      ExpressionAttributeValues: {
        ':inc': { N: String(newRecordCount) },
      },
    }),
  );

  console.log(`Incremented activity count by ${newRecordCount}`);
};
