/* eslint-disable @typescript-eslint/no-explicit-any */
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/api';
import { getCurrentUser, signIn, signOut } from 'aws-amplify/auth';
import { uploadData, getUrl, remove } from 'aws-amplify/storage';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import * as fs from 'fs';
import { randomBytes } from 'crypto';
import {
  getTopic, listTopics,
  getPost, listPosts,
  getComment, listComments,
  fetchUserActivity,
} from './src/graphql/queries';
import {
  createTopic, updateTopic, deleteTopic,
  createPost, updatePost, deletePost,
  createComment, updateComment, deleteComment,
} from './src/graphql/mutations';

// Polyfill crypto for Node.js environment (required for Amplify Auth)
import { webcrypto } from 'crypto';
if (typeof globalThis.crypto === 'undefined') {
  (globalThis as any).crypto = webcrypto;
}


async function main(): Promise<void> {
  const [configPath] = process.argv.slice(2);
  const config = JSON.parse(fs.readFileSync(configPath, { encoding: 'utf-8' }));

  Amplify.configure(config);

  const { username, password } = await signUp(config);

  await signIn({ username, password });

  const currentUser = await getCurrentUser();

  console.log('')
  console.log('='.repeat(60));
  console.log('📖 GraphQL Queries (Topics, Posts, Comments)');
  console.log('='.repeat(60));
  console.log('')

  await testListTopics();
  await testListPosts();
  await testListComments();

  console.log('')
  console.log('='.repeat(60));
  console.log('✏️ Topic CRUD Operations');
  console.log('='.repeat(60));
  console.log('')

  const topicId = await testCreateTopic(currentUser.userId);
  await testGetTopic(topicId);
  await testUpdateTopic(topicId);

  console.log('')
  console.log('='.repeat(60));
  console.log('💬 Post CRUD Operations');
  console.log('='.repeat(60));
  console.log('')

  const postId = await testCreatePost(topicId, currentUser.userId);
  await testGetPost(postId);
  await testUpdatePost(postId);

  console.log('')
  console.log('='.repeat(60));
  console.log('💭 Comment CRUD Operations');
  console.log('='.repeat(60));
  console.log('')

  const commentId = await testCreateComment(postId, currentUser.userId);
  await testGetComment(commentId);
  await testUpdateComment(commentId);

  console.log('')
  console.log('='.repeat(60));
  console.log('📊 User Activity');
  console.log('='.repeat(60));
  console.log('')

  await testFetchUserActivity(currentUser.userId);

  console.log('')
  console.log('='.repeat(60));
  console.log('📸 S3 Storage (Avatars)');
  console.log('='.repeat(60));
  console.log('')

  const avatarKey = await testUploadAvatar();
  await testGetAvatarUrl(avatarKey);
  await testRemoveAvatar(avatarKey);

  console.log('')
  console.log('='.repeat(60));
  console.log('🔖 Bookmarks DDB');
  console.log('='.repeat(60));
  console.log('')

  await testBookmarks(config, currentUser.userId, postId);

  console.log('')
  console.log('='.repeat(60));
  console.log('🧹 Cleanup');
  console.log('='.repeat(60));
  console.log('')

  await testDeleteComment(commentId);
  await testDeletePost(postId);
  await testDeleteTopic(topicId);

  await signOut();
}

main().catch((error) => {
  console.error('Fatal error:', error.message);
  process.exit(1);
});


// ============================================================
// Query Tests
// ============================================================

async function testListTopics(): Promise<void> {
  console.log('📋 Testing listTopics...');
  const client = generateClient();
  const result = await client.graphql({ query: listTopics });
  const topics = (result as any).data.listTopics.items;
  console.log(`✅ Found ${topics.length} topics`);
}

async function testGetTopic(id: string): Promise<void> {
  console.log(`🔍 Testing getTopic (id: ${id.substring(0, 8)}...)...`);
  const client = generateClient();
  const result = await client.graphql({ query: getTopic, variables: { id } });
  console.log('✅ Topic:', (result as any).data.getTopic.content);
}

async function testListPosts(): Promise<void> {
  console.log('📋 Testing listPosts...');
  const client = generateClient();
  const result = await client.graphql({ query: listPosts });
  const posts = (result as any).data.listPosts.items;
  console.log(`✅ Found ${posts.length} posts`);
}

async function testGetPost(id: string): Promise<void> {
  console.log(`🔍 Testing getPost (id: ${id.substring(0, 8)}...)...`);
  const client = generateClient();
  const result = await client.graphql({ query: getPost, variables: { id } });
  const post = (result as any).data.getPost;
  console.log('✅ Post:', post.content?.substring(0, 50));
}

async function testListComments(): Promise<void> {
  console.log('📋 Testing listComments...');
  const client = generateClient();
  const result = await client.graphql({ query: listComments });
  const comments = (result as any).data.listComments.items;
  console.log(`✅ Found ${comments.length} comments`);
}

async function testGetComment(id: string): Promise<void> {
  console.log(`🔍 Testing getComment (id: ${id.substring(0, 8)}...)...`);
  const client = generateClient();
  const result = await client.graphql({ query: getComment, variables: { id } });
  const comment = (result as any).data.getComment;
  console.log('✅ Comment:', comment.content?.substring(0, 50));
}

async function testFetchUserActivity(userId: string): Promise<void> {
  console.log(`📊 Testing fetchUserActivity (userId: ${userId.substring(0, 8)}...)...`);
  const client = generateClient();
  const result = await client.graphql({ query: fetchUserActivity, variables: { userId } });
  const activities = (result as any).data.fetchUserActivity || [];
  console.log(`✅ Found ${activities.length} activities`);
}


// ============================================================
// Mutation Tests
// ============================================================

async function testCreateTopic(userId: string): Promise<string> {
  console.log('🆕 Testing createTopic...');
  const publicClient = generateClient({ authMode: 'apiKey' });

  const result = await publicClient.graphql({
    query: createTopic,
    variables: {
      input: {
        content: `tech:Test Topic ${Date.now()}`,
        createdByUserId: userId,
      },
    },
  });
  const topic = (result as any).data.createTopic;
  console.log('✅ Created topic:', topic.id.substring(0, 8) + '...');
  return topic.id;
}

async function testUpdateTopic(topicId: string): Promise<void> {
  console.log(`✏️ Testing updateTopic (id: ${topicId.substring(0, 8)}...)...`);
  const publicClient = generateClient({ authMode: 'apiKey' });

  await publicClient.graphql({
    query: updateTopic,
    variables: {
      input: { id: topicId, content: `tech:Updated Topic ${Date.now()}` },
    },
  });
  console.log('✅ Updated topic');
}

async function testDeleteTopic(topicId: string): Promise<void> {
  console.log(`🗑️ Testing deleteTopic (id: ${topicId.substring(0, 8)}...)...`);
  const publicClient = generateClient({ authMode: 'apiKey' });

  await publicClient.graphql({
    query: deleteTopic,
    variables: { input: { id: topicId } },
  });
  console.log('✅ Deleted topic');
}

async function testCreatePost(topicId: string, userId: string): Promise<string> {
  console.log('🆕 Testing createPost...');
  const publicClient = generateClient({ authMode: 'apiKey' });

  const result = await publicClient.graphql({
    query: createPost,
    variables: {
      input: {
        content: `Test post created at ${new Date().toISOString()}`,
        topicPostsId: topicId,
        createdByUserId: userId,
      },
    },
  });
  const post = (result as any).data.createPost;
  console.log('✅ Created post:', post.id.substring(0, 8) + '...');
  return post.id;
}

async function testUpdatePost(postId: string): Promise<void> {
  console.log(`✏️ Testing updatePost (id: ${postId.substring(0, 8)}...)...`);
  const publicClient = generateClient({ authMode: 'apiKey' });

  await publicClient.graphql({
    query: updatePost,
    variables: {
      input: { id: postId, content: `Updated post at ${new Date().toISOString()}` },
    },
  });
  console.log('✅ Updated post');
}

async function testDeletePost(postId: string): Promise<void> {
  console.log(`🗑️ Testing deletePost (id: ${postId.substring(0, 8)}...)...`);
  const publicClient = generateClient({ authMode: 'apiKey' });

  await publicClient.graphql({
    query: deletePost,
    variables: { input: { id: postId } },
  });
  console.log('✅ Deleted post');
}

async function testCreateComment(postId: string, userId: string): Promise<string> {
  console.log('🆕 Testing createComment...');
  const publicClient = generateClient({ authMode: 'apiKey' });

  const result = await publicClient.graphql({
    query: createComment,
    variables: {
      input: {
        content: `Test comment at ${new Date().toISOString()}`,
        postCommentsId: postId,
        createdByUserId: userId,
      },
    },
  });
  const comment = (result as any).data.createComment;
  console.log('✅ Created comment:', comment.id.substring(0, 8) + '...');
  return comment.id;
}

async function testUpdateComment(commentId: string): Promise<void> {
  console.log(`✏️ Testing updateComment (id: ${commentId.substring(0, 8)}...)...`);
  const publicClient = generateClient({ authMode: 'apiKey' });

  await publicClient.graphql({
    query: updateComment,
    variables: {
      input: { id: commentId, content: `Updated comment at ${new Date().toISOString()}` },
    },
  });
  console.log('✅ Updated comment');
}

async function testDeleteComment(commentId: string): Promise<void> {
  console.log(`🗑️ Testing deleteComment (id: ${commentId.substring(0, 8)}...)...`);
  const publicClient = generateClient({ authMode: 'apiKey' });

  await publicClient.graphql({
    query: deleteComment,
    variables: { input: { id: commentId } },
  });
  console.log('✅ Deleted comment');
}


// ============================================================
// S3 Avatar Tests
// ============================================================

async function testUploadAvatar(): Promise<string> {
  console.log('📤 Testing uploadData (S3 avatar upload)...');
  // 1x1 transparent PNG
  const testImageBase64 =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const imageBuffer = Buffer.from(testImageBase64, 'base64');
  const fileName = `test-avatar-${Date.now()}.png`;

  const result = await uploadData({
    key: fileName,
    data: imageBuffer,
    options: { contentType: 'image/png' },
  }).result;

  console.log('✅ Upload successful! Key:', result.key);
  return result.key;
}

async function testGetAvatarUrl(avatarKey: string): Promise<void> {
  console.log(`🔗 Testing getUrl (S3 signed URL)...`);

  const result = await getUrl({
    key: avatarKey,
    options: { expiresIn: 3600 },
  });
  console.log('✅ Got signed URL:', result.url.toString().substring(0, 80) + '...');
}

async function testRemoveAvatar(avatarKey: string): Promise<void> {
  console.log(`🗑️ Testing remove (S3 avatar delete)...`);

  await remove({ key: avatarKey });
  console.log('✅ Avatar removed');
}

// ============================================================
// Bookmarks DDB Tests
// ============================================================

async function testBookmarks(config: any, userId: string, postId: string): Promise<void> {
  const region = config.aws_project_region ?? config.aws_dynamodb_all_tables_region;
  const schemas = config.aws_dynamodb_table_schemas ?? [];
  const entry = schemas.find((s: any) => s.tableName?.startsWith('bookmarks-'));
  if (!entry) {
    console.log('⚠️ No bookmarks table found in config, skipping');
    return;
  }
  const tableName = entry.tableName;
  console.log(`   Bookmarks table: ${tableName}`);

  const ddbClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region }));

  console.log('🔖 Testing PutItem (create bookmark)...');
  await ddbClient.send(new PutCommand({
    TableName: tableName,
    Item: { userId, postId, createdAt: new Date().toISOString() },
  }));
  console.log('✅ Bookmark created');

  console.log('🔖 Testing GetItem (read bookmark)...');
  const result = await ddbClient.send(new GetCommand({
    TableName: tableName,
    Key: { userId, postId },
  }));
  if (!result.Item) throw new Error('Bookmark not found');
  console.log('✅ Bookmark found:', result.Item.createdAt);

  console.log('🗑️ Testing DeleteItem (remove bookmark)...');
  await ddbClient.send(new DeleteCommand({
    TableName: tableName,
    Key: { userId, postId },
  }));
  console.log('✅ Bookmark deleted');
}


// ============================================================
// User Provisioning
// ============================================================

async function signUp(config: any): Promise<{ username: string; password: string }> {
  const gen2Auth = (config as any)?.auth;
  const userPoolId = config.aws_user_pools_id ?? gen2Auth?.user_pool_id;
  const region = config.aws_cognito_region ?? gen2Auth?.aws_region;

  // Discussions app uses phone-based auth
  const username = generateTestPhoneNumber();
  const password = generateTestPassword();

  const cognitoClient = new CognitoIdentityProviderClient({ region });

  await cognitoClient.send(new AdminCreateUserCommand({
    UserPoolId: userPoolId,
    Username: username,
    TemporaryPassword: password,
    UserAttributes: [
      { Name: 'email', Value: generateTestEmail() },
      { Name: 'email_verified', Value: 'true' },
      { Name: 'phone_number', Value: username },
      { Name: 'phone_number_verified', Value: 'true' },
    ],
    MessageAction: 'SUPPRESS',
  }));

  await cognitoClient.send(new AdminSetUserPasswordCommand({
    UserPoolId: userPoolId,
    Username: username,
    Password: password,
    Permanent: true,
  }));

  return { username, password };
}

function generateTestPassword(): string {
  return `Test${randomSuffix()}!Aa1`;
}

function generateTestEmail(): string {
  return `testuser-${randomSuffix()}@test.example.com`;
}

function generateTestPhoneNumber(): string {
  const local = Math.floor(1000000 + Math.random() * 9000000);
  return `+1555${local}`;
}

function randomSuffix(): string {
  return randomBytes(4).toString('hex');
}
