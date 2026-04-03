/* eslint-disable @typescript-eslint/no-explicit-any */
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/api';
import { fetchAuthSession, signIn, signOut } from 'aws-amplify/auth';
import { uploadData } from 'aws-amplify/storage';
import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import * as fs from 'fs';
import { randomBytes } from 'crypto';
import { getNote, listNotes, generateThumbnail, addUserToGroup, removeUserFromGroup } from './src/graphql/queries';
import { createNote, updateNote, deleteNote } from './src/graphql/mutations';

// Polyfill crypto for Node.js environment (required for Amplify Auth)
import { webcrypto } from 'crypto';
if (typeof globalThis.crypto === 'undefined') {
  (globalThis as any).crypto = webcrypto;
}

const TEST_GROUP = 'Admin';


async function main(): Promise<void> {
  const [configPath] = process.argv.slice(2);
  const config = JSON.parse(fs.readFileSync(configPath, { encoding: 'utf-8' }));

  Amplify.configure(config);

  const { username, password } = await signUp(config);

  await signIn({ username, password });

  console.log('')
  console.log('='.repeat(60));
  console.log('📖 GraphQL Queries (Notes)');
  console.log('='.repeat(60));
  console.log('')

  const noteId = await testListNotes();
  if (noteId) await testGetNote(noteId);

  console.log('')
  console.log('='.repeat(60));
  console.log('✏️ Note CRUD Operations');
  console.log('='.repeat(60));
  console.log('')

  const createdNoteId = await testCreateNote();
  if (createdNoteId) {
    await testUpdateNote(createdNoteId);
    await testDeleteNote(createdNoteId);
  }

  console.log('')
  console.log('='.repeat(60));
  console.log('⚡ Lambda Function Operations');
  console.log('='.repeat(60));
  console.log('')

  await testGenerateThumbnail();
  await testAddUserToGroup();
  await testRemoveUserFromGroup();

  await signOut();
}

main().catch((error) => {
  console.error('Fatal error:', error.message);
  process.exit(1);
});


// ============================================================
// Query Tests
// ============================================================

async function testListNotes(): Promise<string | null> {
  console.log('📋 Testing listNotes...');
  const authClient = generateClient({ authMode: 'userPool' });
  const result = await authClient.graphql({ query: listNotes });
  const notes = (result as any).data.listNotes.items;
  console.log(`✅ Found ${notes.length} notes`);
  return notes.length > 0 ? notes[0].id : null;
}

async function testGetNote(id: string): Promise<void> {
  console.log(`🔍 Testing getNote (id: ${id.substring(0, 8)}...)...`);
  const authClient = generateClient({ authMode: 'userPool' });
  const result = await authClient.graphql({ query: getNote, variables: { id } });
  const note = (result as any).data.getNote;
  console.log('✅ Note:', note.title);
}


// ============================================================
// Mutation Tests
// ============================================================

async function testCreateNote(): Promise<string | null> {
  console.log('🆕 Testing createNote...');
  const authClient = generateClient({ authMode: 'userPool' });
  const result = await authClient.graphql({
    query: createNote,
    variables: {
      input: {
        title: `Test Note ${Date.now()}`,
        content: 'This is a test note created by the test script.',
      },
    },
  });
  const note = (result as any).data.createNote;
  console.log('✅ Created note:', note.id.substring(0, 8) + '...');
  return note.id;
}

async function testUpdateNote(noteId: string): Promise<void> {
  console.log(`✏️ Testing updateNote (id: ${noteId.substring(0, 8)}...)...`);
  const authClient = generateClient({ authMode: 'userPool' });
  await authClient.graphql({
    query: updateNote,
    variables: {
      input: {
        id: noteId,
        title: 'Updated Test Note',
        content: 'This note was updated by the test script.',
      },
    },
  });
  console.log('✅ Updated note');
}

async function testDeleteNote(noteId: string): Promise<void> {
  console.log(`🗑️ Testing deleteNote (id: ${noteId.substring(0, 8)}...)...`);
  const authClient = generateClient({ authMode: 'userPool' });
  await authClient.graphql({
    query: deleteNote,
    variables: { input: { id: noteId } },
  });
  console.log('✅ Deleted note');
}


// ============================================================
// Lambda Function Tests
// ============================================================

async function getUserSub(): Promise<string> {
  const session = await fetchAuthSession();
  const sub = session.tokens?.idToken?.payload.sub as string;
  if (!sub) throw new Error('Could not retrieve user sub');
  return sub;
}

async function testGenerateThumbnail(): Promise<void> {
  console.log('🖼️  Testing generateThumbnail Lambda...');

  // Upload a small test image to S3 first
  const testImageBase64 =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const imageBuffer = Buffer.from(testImageBase64, 'base64');
  const key = `media/test-${Date.now()}.png`;

  const uploadResult = await uploadData({
    path: ({ identityId }: { identityId: string }) => `private/${identityId}/${key}`,
    data: imageBuffer,
  }).result;

  const fullKey = uploadResult.path;
  console.log(`   📤 Uploaded test image: ${fullKey}`);

  const publicClient = generateClient({ authMode: 'apiKey' });
  const result = await publicClient.graphql({
    query: generateThumbnail,
    variables: { mediaFileKey: fullKey },
  });
  const response = (result as any).data.generateThumbnail;
  console.log('✅ Thumbnail response:', response.statusCode, response.message);
}

async function testAddUserToGroup(): Promise<void> {
  console.log('👥 Testing addUserToGroup Lambda...');
  const userSub = await getUserSub();
  const publicClient = generateClient({ authMode: 'apiKey' });
  const result = await publicClient.graphql({
    query: addUserToGroup,
    variables: { userSub, group: TEST_GROUP },
  });
  const response = (result as any).data.addUserToGroup;
  console.log('✅ Add to group:', response.statusCode, response.message);
}

async function testRemoveUserFromGroup(): Promise<void> {
  console.log('👥 Testing removeUserFromGroup Lambda...');
  const userSub = await getUserSub();
  const publicClient = generateClient({ authMode: 'apiKey' });
  const result = await publicClient.graphql({
    query: removeUserFromGroup,
    variables: { userSub, group: TEST_GROUP },
  });
  const response = (result as any).data.removeUserFromGroup;
  console.log('✅ Remove from group:', response.statusCode, response.message);
}


// ============================================================
// User Provisioning
// ============================================================

async function signUp(config: any): Promise<{ username: string; password: string }> {
  const gen2Auth = (config as any)?.auth;
  const userPoolId = config.aws_user_pools_id ?? gen2Auth?.user_pool_id;
  const region = config.aws_cognito_region ?? gen2Auth?.aws_region;

  // Media-vault supports email or phone sign-in; email is simpler for testing
  const username = generateTestEmail();
  const password = generateTestPassword();

  const cognitoClient = new CognitoIdentityProviderClient({ region });

  await cognitoClient.send(new AdminCreateUserCommand({
    UserPoolId: userPoolId,
    Username: username,
    TemporaryPassword: password,
    UserAttributes: [
      { Name: 'email', Value: username },
      { Name: 'email_verified', Value: 'true' },
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

function randomSuffix(): string {
  return randomBytes(4).toString('hex');
}
