// test-utils.ts
/**
 * Shared test utilities for MediaVault Gen1 and Gen2 test scripts
 */

import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/api';
import { fetchAuthSession } from 'aws-amplify/auth';
import { uploadData } from 'aws-amplify/storage';
import { readFileSync, existsSync } from 'fs';
import { getNote, listNotes, generateThumbnail, addUserToGroup, removeUserFromGroup } from './src/graphql/queries';
import { createNote, updateNote, deleteNote } from './src/graphql/mutations';
import { TestRunner } from '../_test-common/test-apps-test-utils';
import amplifyconfig from './src/amplifyconfiguration.json';

// Configure Amplify in this module to ensure api/storage singletons see the config
Amplify.configure(amplifyconfig);

// Test data for Lambda functions
const TEST_IMAGE_PATH = './test-image.jpg';
const TEST_GROUP = 'Admin';

// ============================================================
// Shared Test Functions Factory
// ============================================================

export function createTestFunctions() {
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

  async function testGetNote(id: string): Promise<void> {
    console.log(`\n🔍 Testing getNote (id: ${id})...`);
    const authClient = generateClient({ authMode: 'userPool' });
    const result = await authClient.graphql({ query: getNote, variables: { id } });
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

    console.log('   📤 Uploading test image to S3...');
    let imageBuffer: Buffer;

    if (existsSync(TEST_IMAGE_PATH)) {
      imageBuffer = readFileSync(TEST_IMAGE_PATH);
      console.log('   Using local image file');
    } else {
      const testImageBase64 =
        'iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAIAAAD/gAIDAAAA3klEQVR42u3QMQEAAAgDILV/51nBzwci0JlYsWLFihUrVqxYsWLFihUrVqxYsWLFihUrVqxYsWLFihUrVqxYsWLFihUrVqxYsWLFihUrVqxYsWLFihUrVqxYsWLFihUrVqxYsWLFihUrVqxYsWLFihUrVqxYsWLFihUrVqxYsWLFihUrVqxYsWLFihUrVqxYsWLFihUrVqxYsWLFihUrVqxYsWLFihUrVqxYsWLFihUrVqxYsWLFihUrVqxYsWLFihUrVqxYsWLFihUrVqxYsWLFihUrVqxYsWLFihUrVqz8WgGPGAGBPQqrHAAAAABJRU5ErkJggg==';
      imageBuffer = Buffer.from(testImageBase64, 'base64');
      console.log('   Using generated test image (no local file found)');
    }

    const key = `media/test-${Date.now()}.jpg`;
    const uploadResult = await uploadData({
      path: ({ identityId }: { identityId: string }) => `private/${identityId}/${key}`,
      data: imageBuffer,
    }).result;

    console.log(`   ✅ Image uploaded: ${key}`);
    const fullKey = uploadResult.path;
    console.log(`   🔑 Full S3 key: ${fullKey}`);

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
  }

  async function testAddUserToGroup(): Promise<void> {
    console.log(`\n👥 Testing addUserToGroup Lambda function...`);
    const userSub = await getUserSub();
    if (!userSub) throw new Error('Could not retrieve user sub');

    const publicClient = generateClient({ authMode: 'apiKey' });
    const result = await publicClient.graphql({
      query: addUserToGroup,
      variables: { userSub, group: TEST_GROUP },
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
    if (!userSub) throw new Error('Could not retrieve user sub');

    const publicClient = generateClient({ authMode: 'apiKey' });
    const result = await publicClient.graphql({
      query: removeUserFromGroup,
      variables: { userSub, group: TEST_GROUP },
    });
    const response = (result as any).data.removeUserFromGroup;
    console.log('✅ Remove user from group response:', {
      statusCode: response.statusCode,
      message: response.message,
    });
  }

  return {
    testListNotes,
    testGetNote,
    testCreateNote,
    testUpdateNote,
    testDeleteNote,
    testGenerateThumbnail,
    testAddUserToGroup,
    testRemoveUserFromGroup,
  };
}

// ============================================================
// Shared Test Orchestration Functions
// ============================================================

export function createTestOrchestrator(testFunctions: ReturnType<typeof createTestFunctions>, runner: TestRunner) {
  async function runQueryTests(): Promise<void> {
    console.log('\n' + '='.repeat(50));
    console.log('📖 PART 1: Authenticated GraphQL Queries');
    console.log('='.repeat(50));

    const noteId = await runner.runTest('listNotes', testFunctions.testListNotes);
    if (noteId) await runner.runTest('getNote', () => testFunctions.testGetNote(noteId));
  }

  async function runMutationTests(): Promise<void> {
    console.log('\n' + '='.repeat(50));
    console.log('✏️ PART 2: Authenticated GraphQL Mutations');
    console.log('='.repeat(50));

    const noteId = await runner.runTest('createNote', testFunctions.testCreateNote);
    if (noteId) {
      await runner.runTest('updateNote', () => testFunctions.testUpdateNote(noteId));
      await runner.runTest('deleteNote', () => testFunctions.testDeleteNote(noteId));
    }
  }

  async function runLambdaFunctionTests(): Promise<void> {
    console.log('\n' + '='.repeat(50));
    console.log('⚡ PART 3: Lambda Function Operations');
    console.log('='.repeat(50));

    console.log('\n💡 Note: These tests require proper setup:');
    console.log('   - Thumbnail generation requires a valid S3 media file key');
    console.log('   - User group management requires Admin permissions\n');

    await runner.runTest('generateThumbnail', testFunctions.testGenerateThumbnail);
    await runner.runTest('addUserToGroup', testFunctions.testAddUserToGroup);
    await runner.runTest('removeUserFromGroup', testFunctions.testRemoveUserFromGroup);
  }

  return { runQueryTests, runMutationTests, runLambdaFunctionTests };
}
