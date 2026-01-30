/***
 * Consolidated Test Script for MediaVault App
 *
 * This script tests all functionality:
 * 1. Authenticated GraphQL Queries (requires auth)
 * 2. Authenticated GraphQL Mutations (requires auth)
 * 3. Lambda Function Queries (thumbnail generation, user group management)
 *
 * IMPORTANT: Update TEST_USER credentials before running tests.
 */

// Polyfill crypto for Node.js environment (required for Amplify Auth)
import { webcrypto } from 'crypto';
if (typeof globalThis.crypto === 'undefined') {
  (globalThis as any).crypto = webcrypto;
}

import { generateClient } from 'aws-amplify/api';
import { Amplify } from 'aws-amplify';
import { signIn, signOut, getCurrentUser, fetchAuthSession } from 'aws-amplify/auth';
import { uploadData } from 'aws-amplify/storage';
import { readFileSync } from 'fs';
import amplifyconfig from './src/amplifyconfiguration.json';
import { getNote, listNotes, generateThumbnail, addUserToGroup, removeUserFromGroup } from './src/graphql/queries';
import { createNote, updateNote, deleteNote } from './src/graphql/mutations';
import { createTestRunner } from './test-utils';

// Configure Amplify
Amplify.configure(amplifyconfig);

// Initialize test runner
const { runTest, printSummary } = createTestRunner();

// ============================================================
// CONFIGURATION - Update with your test user credentials
// ============================================================
const TEST_USER = {
  username: 'YOUR_USERNAME_HERE',
  password: 'YOUR_PASSWORD_HERE',
};

// Test data for Lambda functions
const TEST_IMAGE_PATH = 'YOUR_TEST_IMAGE_PATH'; // Path to a test image file
const TEST_GROUP = 'Admin'; // Group name for user management tests

// ============================================================
// Authentication Helper Functions
// ============================================================
async function authenticateUser(): Promise<boolean> {
  console.log('\n🔐 Authenticating user...');
  try {
    await signIn({
      username: TEST_USER.username,
      password: TEST_USER.password,
    });
    const user = await getCurrentUser();
    console.log(`✅ Signed in as: ${user.username}`);
    return true;
  } catch (error: any) {
    if (error.name === 'UserAlreadyAuthenticatedException') {
      const user = await getCurrentUser();
      console.log(`✅ Already signed in as: ${user.username}`);
      return true;
    }
    console.log('❌ Authentication failed:', error.message || error);
    return false;
  }
}

async function signOutUser(): Promise<void> {
  console.log('\n🚪 Signing out...');
  try {
    await signOut();
    console.log('✅ Signed out successfully');
  } catch (error) {
    console.log('❌ Sign out error:', error);
  }
}

async function getUserSub(): Promise<string | null> {
  try {
    const session = await fetchAuthSession();
    return (session.tokens?.idToken?.payload.sub as string) || null;
  } catch (error) {
    console.log('❌ Error getting user sub:', error);
    return null;
  }
}

// ============================================================
// Query Test Functions - Notes
// ============================================================
async function testListNotes(): Promise<string | null> {
  console.log('\n📋 Testing listNotes...');
  const authClient = generateClient({ authMode: 'userPool' });
  const result = await authClient.graphql({ query: listNotes });
  const notes = (result as any).data.listNotes.items;
  console.log(`✅ Found ${notes.length} notes:`);
  notes.forEach((n: any) => console.log(`   - [${n.id}] ${n.title}${n.content ? ` - ${n.content.substring(0, 50)}...` : ''}`));
  return notes.length > 0 ? notes[0].id : null;
}

async function testGetNote(id: string) {
  console.log(`\n🔍 Testing getNote (id: ${id})...`);
  const authClient = generateClient({ authMode: 'userPool' });
  const result = await authClient.graphql({
    query: getNote,
    variables: { id },
  });
  const note = (result as any).data.getNote;
  console.log('✅ Note:', {
    id: note.id,
    title: note.title,
    content: note.content,
    owner: note.owner,
    createdAt: note.createdAt,
  });
}

// ============================================================
// Mutation Test Functions - Notes
// ============================================================
async function testCreateNote(): Promise<string | null> {
  console.log('\n🆕 Testing createNote...');
  const authClient = generateClient({ authMode: 'userPool' });
  const result = await authClient.graphql({
    query: createNote,
    variables: {
      input: {
        title: `Test Note ${Date.now()}`,
        content: 'This is a test note created by the test script. It contains sample content for testing purposes.',
      },
    },
  });
  const note = (result as any).data.createNote;
  console.log('✅ Created note:', {
    id: note.id,
    title: note.title,
    content: note.content,
    owner: note.owner,
  });
  return note.id;
}

async function testUpdateNote(noteId: string): Promise<void> {
  console.log(`\n✏️ Testing updateNote (id: ${noteId})...`);
  const authClient = generateClient({ authMode: 'userPool' });
  const result = await authClient.graphql({
    query: updateNote,
    variables: {
      input: {
        id: noteId,
        title: 'Updated Test Note',
        content: 'This note was updated by the test script with new content.',
      },
    },
  });
  const note = (result as any).data.updateNote;
  console.log('✅ Updated note:', {
    id: note.id,
    title: note.title,
    content: note.content,
  });
}

async function testDeleteNote(noteId: string): Promise<void> {
  console.log(`\n🗑️ Testing deleteNote (id: ${noteId})...`);
  const authClient = generateClient({ authMode: 'userPool' });
  const result = await authClient.graphql({
    query: deleteNote,
    variables: { input: { id: noteId } },
  });
  const deleted = (result as any).data.deleteNote;
  console.log('✅ Deleted note:', deleted.title);
}

// ============================================================
// Lambda Function Test Functions
// ============================================================
async function testGenerateThumbnail(): Promise<void> {
  console.log('\n🖼️  Testing generateThumbnail Lambda function...');

  try {
    // Step 1: Upload a test image to S3
    console.log('   📤 Uploading test image to S3...');
    const imageBuffer = readFileSync(TEST_IMAGE_PATH);
    const key = `media/test-${Date.now()}.jpg`;

    const uploadResult = await uploadData({
      path: ({ identityId }) => `private/${identityId}/${key}`,
      data: imageBuffer,
    }).result;

    console.log(`   ✅ Image uploaded: ${key}`);

    // Step 2: Get the full S3 path from upload result
    const fullKey = uploadResult.path;
    console.log(`   🔑 Full S3 key: ${fullKey}`);

    // Step 3: Call the thumbnail generation Lambda
    console.log('   🎨 Generating thumbnail...');
    const publicClient = generateClient({ authMode: 'apiKey' });
    const result = await publicClient.graphql({
      query: generateThumbnail,
      variables: { mediaFileKey: fullKey },
    });
    const response = (result as any).data.generateThumbnail;
    console.log('✅ Thumbnail generation response:', {
      statusCode: response.statusCode,
      message: response.message,
    });
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      console.log('⏭️  Skipping thumbnail test - test image file not found');
      console.log(`   Please add an image file at: ${TEST_IMAGE_PATH}`);
      console.log('   Or update TEST_IMAGE_PATH to point to an existing image');
      return;
    }
    throw error;
  }
}

async function testAddUserToGroup(): Promise<void> {
  console.log(`\n👥 Testing addUserToGroup Lambda function...`);
  const userSub = await getUserSub();
  if (!userSub) {
    throw new Error('Could not retrieve user sub');
  }

  // Use API Key auth mode (same as frontend publicClient)
  const publicClient = generateClient({ authMode: 'apiKey' });
  const result = await publicClient.graphql({
    query: addUserToGroup,
    variables: {
      userSub: userSub,
      group: TEST_GROUP,
    },
  });
  const response = (result as any).data.addUserToGroup;
  console.log('✅ Add user to group response:', {
    statusCode: response.statusCode,
    message: response.message,
  });
}

async function testRemoveUserFromGroup(): Promise<void> {
  console.log(`\n👥 Testing removeUserFromGroup Lambda function...`);
  const userSub = await getUserSub();
  if (!userSub) {
    throw new Error('Could not retrieve user sub');
  }

  // Use API Key auth mode (same as frontend publicClient)
  const publicClient = generateClient({ authMode: 'apiKey' });
  const result = await publicClient.graphql({
    query: removeUserFromGroup,
    variables: {
      userSub: userSub,
      group: TEST_GROUP,
    },
  });
  const response = (result as any).data.removeUserFromGroup;
  console.log('✅ Remove user from group response:', {
    statusCode: response.statusCode,
    message: response.message,
  });
}

// ============================================================
// Main Test Runners
// ============================================================
async function runQueryTests() {
  console.log('\n' + '='.repeat(50));
  console.log('📖 PART 1: Authenticated GraphQL Queries');
  console.log('='.repeat(50));

  const noteId = await runTest('listNotes', testListNotes);
  if (noteId) await runTest('getNote', () => testGetNote(noteId));
}

async function runMutationTests() {
  console.log('\n' + '='.repeat(50));
  console.log('✏️ PART 2: Authenticated GraphQL Mutations');
  console.log('='.repeat(50));

  // Create, update, and delete note
  const noteId = await runTest('createNote', testCreateNote);
  if (noteId) {
    await runTest('updateNote', () => testUpdateNote(noteId));
    await runTest('deleteNote', () => testDeleteNote(noteId));
  }
}

async function runLambdaFunctionTests() {
  console.log('\n' + '='.repeat(50));
  console.log('⚡ PART 3: Lambda Function Operations');
  console.log('='.repeat(50));

  console.log('\n💡 Note: These tests require proper setup:');
  console.log('   - Thumbnail generation requires a valid S3 media file key');
  console.log('   - User group management requires Admin permissions\n');

  await runTest('generateThumbnail', testGenerateThumbnail);
  await runTest('addUserToGroup', testAddUserToGroup);
  await runTest('removeUserFromGroup', testRemoveUserFromGroup);
}

async function runAllTests() {
  console.log('🚀 Starting Consolidated Test Script for MediaVault\n');
  console.log('This script tests:');
  console.log('  1. Authenticated GraphQL Queries (Notes)');
  console.log('  2. Authenticated GraphQL Mutations (Notes)');
  console.log('  3. Lambda Function Operations (Thumbnails, User Groups)');

  // Check credentials
  if (TEST_USER.username === 'YOUR_USERNAME_HERE') {
    console.log('\n⚠️  Please update TEST_USER credentials before running!');
    console.log('   Edit the TEST_USER object at the top of this file.');
    return;
  }

  // Authenticate
  const isAuthenticated = await authenticateUser();
  if (!isAuthenticated) {
    console.log('\n❌ Cannot run tests without authentication');
    return;
  }

  // Part 1: Queries
  await runQueryTests();

  // Part 2: Mutations
  await runMutationTests();

  // Part 3: Lambda Functions
  await runLambdaFunctionTests();

  // Sign out
  await signOutUser();

  // Print summary and exit with appropriate code
  printSummary();
}

// Run all tests
void runAllTests();
