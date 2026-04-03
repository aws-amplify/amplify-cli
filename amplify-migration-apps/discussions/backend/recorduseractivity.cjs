/* Amplify Params - DO NOT EDIT
  ENV
  FUNCTION_ACTIVITYLOGGER_NAME
  REGION
Amplify Params - DO NOT EDIT */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

const dynamoDB = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE_NAME = process.env.STORAGE_ACTIVITY_NAME;

const crypto = require("crypto");

/**
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */
exports.handler = async (event) => {
  console.log(`EVENT: ${JSON.stringify(event)}`);

  for (const record of event.Records ?? []) {
    const eventName = record.eventName;
    const image = record.dynamodb.NewImage;
    const createdByUserId = image.createdByUserId.S;
    const typename = image.__typename.S;
    const activityType = `${eventName}_${typename}`;
    await recordUserActivity(createdByUserId, activityType);
  }
};

async function recordUserActivity(userId, activityType) {

  const timestamp = new Date().toISOString();

  await dynamoDB.send(new PutCommand({
    TableName: TABLE_NAME,
    Item: { id: crypto.randomUUID(), userId, activityType, timestamp }
  }));

}
