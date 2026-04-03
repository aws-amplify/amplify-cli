/* eslint-disable @typescript-eslint/no-explicit-any */
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/api';
import { getCurrentUser, signIn, signOut } from 'aws-amplify/auth';
import { uploadData, getUrl, remove } from 'aws-amplify/storage';
import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import * as fs from 'fs';
import { randomBytes } from 'crypto';
import {
  getMoodItem, listMoodItems,
  getBoard, listBoards,
  moodItemsByBoardID,
  getRandomEmoji, getKinesisEvents,
} from './src/graphql/queries';
import {
  createMoodItem, updateMoodItem, deleteMoodItem,
  createBoard, updateBoard, deleteBoard,
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
  console.log('📖 GraphQL Queries (Boards, MoodItems)');
  console.log('='.repeat(60));
  console.log('')

  await testListBoards();
  await testListMoodItems();

  console.log('')
  console.log('='.repeat(60));
  console.log('📝 Board CRUD Operations');
  console.log('='.repeat(60));
  console.log('')

  const boardId = await testCreateBoard();
  await testGetBoard(boardId);
  await testUpdateBoard(boardId);

  console.log('')
  console.log('='.repeat(60));
  console.log('🎨 MoodItem CRUD Operations');
  console.log('='.repeat(60));
  console.log('')

  const moodItemId = await testCreateMoodItem(boardId);
  await testGetMoodItem(moodItemId);
  await testUpdateMoodItem(moodItemId);
  await testMoodItemsByBoardID(boardId);

  console.log('')
  console.log('='.repeat(60));
  console.log('⚡ Lambda Function Operations');
  console.log('='.repeat(60));
  console.log('')

  await testGetRandomEmoji();
  await testGetKinesisEvents();

  console.log('')
  console.log('='.repeat(60));
  console.log('📸 S3 Storage Operations');
  console.log('='.repeat(60));
  console.log('')

  const imageKey = await testUploadImage();
  await testGetImageUrl(imageKey);
  await testRemoveImage(imageKey);

  console.log('')
  console.log('='.repeat(60));
  console.log('🧹 Cleanup');
  console.log('='.repeat(60));
  console.log('')

  await testDeleteMoodItem(moodItemId);
  await testDeleteBoard(boardId);

  await signOut();
}

main().catch((error) => {
  console.error('Fatal error:', error.message);
  process.exit(1);
});


// ============================================================
// Query Tests
// ============================================================

async function testListBoards(): Promise<void> {
  console.log('📋 Testing listBoards...');
  const publicClient = generateClient({ authMode: 'apiKey' });
  const result = await publicClient.graphql({ query: listBoards });
  const boards = (result as any).data.listBoards.items;
  console.log(`✅ Found ${boards.length} boards`);
}

async function testGetBoard(id: string): Promise<void> {
  console.log(`🔍 Testing getBoard (id: ${id.substring(0, 8)}...)...`);
  const publicClient = generateClient({ authMode: 'apiKey' });
  const result = await publicClient.graphql({ query: getBoard, variables: { id } });
  const board = (result as any).data.getBoard;
  console.log('✅ Board:', board.name);
}

async function testListMoodItems(): Promise<void> {
  console.log('🎨 Testing listMoodItems...');
  const publicClient = generateClient({ authMode: 'apiKey' });
  const result = await publicClient.graphql({ query: listMoodItems });
  const items = (result as any).data.listMoodItems.items;
  console.log(`✅ Found ${items.length} mood items`);
}

async function testGetMoodItem(id: string): Promise<void> {
  console.log(`🔍 Testing getMoodItem (id: ${id.substring(0, 8)}...)...`);
  const publicClient = generateClient({ authMode: 'apiKey' });
  const result = await publicClient.graphql({ query: getMoodItem, variables: { id } });
  const item = (result as any).data.getMoodItem;
  console.log('✅ MoodItem:', item.title);
}

async function testMoodItemsByBoardID(boardID: string): Promise<void> {
  console.log(`📋 Testing moodItemsByBoardID (boardID: ${boardID.substring(0, 8)}...)...`);
  const publicClient = generateClient({ authMode: 'apiKey' });
  const result = await publicClient.graphql({ query: moodItemsByBoardID, variables: { boardID } });
  const items = (result as any).data.moodItemsByBoardID.items;
  console.log(`✅ Found ${items.length} mood items for board`);
}


// ============================================================
// Mutation Tests
// ============================================================

async function testCreateBoard(): Promise<string> {
  console.log('🆕 Testing createBoard...');
  const publicClient = generateClient({ authMode: 'apiKey' });
  const result = await publicClient.graphql({
    query: createBoard,
    variables: { input: { name: `Test Board ${Date.now()}` } },
  });
  const board = (result as any).data.createBoard;
  console.log('✅ Created board:', board.id.substring(0, 8) + '...');
  return board.id;
}

async function testUpdateBoard(boardId: string): Promise<void> {
  console.log(`✏️ Testing updateBoard (id: ${boardId.substring(0, 8)}...)...`);
  const publicClient = generateClient({ authMode: 'apiKey' });
  await publicClient.graphql({
    query: updateBoard,
    variables: { input: { id: boardId, name: `Updated Board ${Date.now()}` } },
  });
  console.log('✅ Updated board');
}

async function testDeleteBoard(boardId: string): Promise<void> {
  console.log(`🗑️ Testing deleteBoard (id: ${boardId.substring(0, 8)}...)...`);
  const publicClient = generateClient({ authMode: 'apiKey' });
  await publicClient.graphql({
    query: deleteBoard,
    variables: { input: { id: boardId } },
  });
  console.log('✅ Deleted board');
}

async function testCreateMoodItem(boardId: string): Promise<string> {
  console.log('🆕 Testing createMoodItem...');
  const publicClient = generateClient({ authMode: 'apiKey' });
  const result = await publicClient.graphql({
    query: createMoodItem,
    variables: {
      input: {
        title: `Test Mood ${Date.now()}`,
        description: 'A test mood item created by the test script',
        image: 'https://example.com/test-mood.png',
        boardID: boardId,
      },
    },
  });
  const item = (result as any).data.createMoodItem;
  console.log('✅ Created mood item:', item.id.substring(0, 8) + '...');
  return item.id;
}

async function testUpdateMoodItem(itemId: string): Promise<void> {
  console.log(`✏️ Testing updateMoodItem (id: ${itemId.substring(0, 8)}...)...`);
  const publicClient = generateClient({ authMode: 'apiKey' });
  await publicClient.graphql({
    query: updateMoodItem,
    variables: {
      input: {
        id: itemId,
        title: `Updated Mood ${Date.now()}`,
        description: 'This mood item was updated by the test script',
      },
    },
  });
  console.log('✅ Updated mood item');
}

async function testDeleteMoodItem(itemId: string): Promise<void> {
  console.log(`🗑️ Testing deleteMoodItem (id: ${itemId.substring(0, 8)}...)...`);
  const publicClient = generateClient({ authMode: 'apiKey' });
  await publicClient.graphql({
    query: deleteMoodItem,
    variables: { input: { id: itemId } },
  });
  console.log('✅ Deleted mood item');
}


// ============================================================
// Lambda Function Tests
// ============================================================

async function testGetRandomEmoji(): Promise<void> {
  console.log('🎲 Testing getRandomEmoji (Lambda)...');
  const authClient = generateClient({ authMode: 'userPool' });
  const result = await authClient.graphql({ query: getRandomEmoji });
  const emoji = (result as any).data.getRandomEmoji;
  console.log(`✅ Got random emoji: ${emoji}`);
}

async function testGetKinesisEvents(): Promise<void> {
  console.log('📊 Testing getKinesisEvents (Lambda)...');
  const authClient = generateClient({ authMode: 'userPool' });
  const result = await authClient.graphql({ query: getKinesisEvents });
  const raw = (result as any).data.getKinesisEvents;
  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = raw;
  }
  if (parsed?.events) {
    console.log(`✅ Got ${parsed.events.length} Kinesis events`);
  } else if (parsed?.error) {
    console.log(`✅ Kinesis reader responded (stream may be empty): ${parsed.error}`);
  } else {
    console.log('✅ Kinesis reader responded:', JSON.stringify(parsed).substring(0, 100));
  }
}


// ============================================================
// S3 Storage Tests
// ============================================================

async function testUploadImage(): Promise<string> {
  console.log('📤 Testing uploadData (S3 image upload)...');
  // 1x1 transparent PNG
  const testImageBase64 =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const imageBuffer = Buffer.from(testImageBase64, 'base64');
  const fileName = `test-mood-image-${Date.now()}.png`;

  const result = await uploadData({
    key: fileName,
    data: imageBuffer,
    options: { contentType: 'image/png' },
  }).result;

  console.log('✅ Upload successful! Key:', result.key);
  return result.key;
}

async function testGetImageUrl(imageKey: string): Promise<void> {
  console.log('🔗 Testing getUrl (S3 signed URL)...');

  const result = await getUrl({
    key: imageKey,
    options: { expiresIn: 3600 },
  });
  console.log('✅ Got signed URL:', result.url.toString().substring(0, 80) + '...');
}

async function testRemoveImage(imageKey: string): Promise<void> {
  console.log('🗑️ Testing remove (S3 image delete)...');

  await remove({ key: imageKey });
  console.log('✅ Image removed');
}


// ============================================================
// User Provisioning
// ============================================================

async function signUp(config: any): Promise<{ username: string; password: string }> {
  const gen2Auth = (config as any)?.auth;
  const userPoolId = config.aws_user_pools_id ?? gen2Auth?.user_pool_id;
  const region = config.aws_cognito_region ?? gen2Auth?.aws_region;

  // Mood board app uses email-based auth
  const email = generateTestEmail();
  const password = generateTestPassword();

  const cognitoClient = new CognitoIdentityProviderClient({ region });

  await cognitoClient.send(new AdminCreateUserCommand({
    UserPoolId: userPoolId,
    Username: email,
    TemporaryPassword: password,
    UserAttributes: [
      { Name: 'email', Value: email },
      { Name: 'email_verified', Value: 'true' },
    ],
    MessageAction: 'SUPPRESS',
  }));

  await cognitoClient.send(new AdminSetUserPasswordCommand({
    UserPoolId: userPoolId,
    Username: email,
    Password: password,
    Permanent: true,
  }));

  return { username: email, password };
}

function generateTestPassword(): string {
  return `Test${randomSuffix()}!Aa1`;
}

function generateTestEmail(): string {
  return `testuser-${randomSuffix()}@test.example.com`;
}

function randomSuffix(): string {
  return randomBytes(4).toString('hex');
}
