/* eslint-disable @typescript-eslint/no-explicit-any */
import { getCurrentUser, signIn, signOut } from 'aws-amplify/auth';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { signUp, configureAmplify } from './signup';

let username: string;
let password: string;

let config: any;

beforeAll(async () => {
  config = configureAmplify();
  const creds = await signUp(config);
  username = creds.username;
  password = creds.password;
  await signIn({ username, password });
}, 60_000);

afterAll(async () => {
  await signOut();
});

describe('auth', () => {
  it('puts, gets, and deletes a bookmark', async () => {
    const region = config.aws_project_region ?? config.aws_dynamodb_all_tables_region;
    const schemas = config.aws_dynamodb_table_schemas ?? [];
    const entry = schemas.find((s: any) => s.tableName?.startsWith('bookmarks-'));
    if (!entry) {
      console.warn('No bookmarks table found in config, skipping');
      return;
    }
    const tableName = entry.tableName;

    const currentUser = await getCurrentUser();
    const userId = currentUser.userId;
    const postId = `test-post-${Date.now()}`;
    const createdAt = new Date().toISOString();

    const ddbClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region }));

    await ddbClient.send(
      new PutCommand({
        TableName: tableName,
        Item: { userId, postId, createdAt },
      }),
    );

    const getResult = await ddbClient.send(
      new GetCommand({
        TableName: tableName,
        Key: { userId, postId },
      }),
    );

    expect(getResult.Item).toBeDefined();
    expect(getResult.Item!.userId).toBe(userId);
    expect(getResult.Item!.postId).toBe(postId);
    expect(getResult.Item!.createdAt).toBe(createdAt);

    await ddbClient.send(
      new DeleteCommand({
        TableName: tableName,
        Key: { userId, postId },
      }),
    );

    const afterDelete = await ddbClient.send(
      new GetCommand({
        TableName: tableName,
        Key: { userId, postId },
      }),
    );

    expect(afterDelete.Item).toBeUndefined();
  });
});
