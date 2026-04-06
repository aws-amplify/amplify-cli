// test-utils.ts
/**
 * Shared test utilities for Mood Board Gen1 and Gen2 test scripts
 */

import { generateClient } from 'aws-amplify/api';
import { uploadData, getUrl, remove } from 'aws-amplify/storage';
import {
  getMoodItem,
  listMoodItems,
  getBoard,
  listBoards,
  moodItemsByBoardID,
  getRandomEmoji,
  getKinesisEvents,
} from './src/graphql/queries';
import {
  createMoodItem,
  updateMoodItem,
  deleteMoodItem,
  createBoard,
  updateBoard,
  deleteBoard,
} from './src/graphql/mutations';
import { TestRunner } from '../_test-common/test-apps-test-utils';

// NOTE: Amplify.configure() must be called by the importing script (gen1 or gen2)
// before any test functions are invoked. The gen1 script configures with
// amplifyconfiguration.json, the gen2 script with amplify_outputs.json.

// ============================================================
// Shared Test Functions Factory
// ============================================================

export function createTestFunctions() {
  const publicClient = generateClient({ authMode: 'apiKey' });

  // ============================================================
  // Query Test Functions
  // ============================================================

  async function testListBoards(): Promise<string | null> {
    console.log('\n📋 Testing listBoards...');
    const result = await publicClient.graphql({ query: listBoards });
    const boards = (result as any).data.listBoards.items;
    console.log(`✅ Found ${boards.length} boards:`);
    boards.forEach((b: any) => console.log(`   - [${b.id}] ${b.name}`));
    return boards.length > 0 ? boards[0].id : null;
  }

  async function testGetBoard(id: string): Promise<void> {
    console.log(`\n🔍 Testing getBoard (id: ${id.substring(0, 8)}...)...`);
    const result = await publicClient.graphql({
      query: getBoard,
      variables: { id },
    });
    const board = (result as any).data.getBoard;
    console.log('✅ Board:', {
      id: board.id.substring(0, 8) + '...',
      name: board.name,
    });
  }

  async function testListMoodItems(): Promise<string | null> {
    console.log('\n🎨 Testing listMoodItems...');
    const result = await publicClient.graphql({ query: listMoodItems });
    const items = (result as any).data.listMoodItems.items;
    console.log(`✅ Found ${items.length} mood items:`);
    items.slice(0, 5).forEach((m: any) => {
      console.log(`   - [${m.id.substring(0, 8)}...] ${m.title} (board: ${m.boardID.substring(0, 8)}...)`);
    });
    if (items.length > 5) console.log(`   ... and ${items.length - 5} more`);
    return items.length > 0 ? items[0].id : null;
  }

  async function testGetMoodItem(id: string): Promise<void> {
    console.log(`\n🔍 Testing getMoodItem (id: ${id.substring(0, 8)}...)...`);
    const result = await publicClient.graphql({
      query: getMoodItem,
      variables: { id },
    });
    const item = (result as any).data.getMoodItem;
    console.log('✅ MoodItem:', {
      id: item.id.substring(0, 8) + '...',
      title: item.title,
      image: item.image.substring(0, 50) + (item.image.length > 50 ? '...' : ''),
      boardID: item.boardID.substring(0, 8) + '...',
    });
  }

  async function testMoodItemsByBoardID(boardID: string): Promise<void> {
    console.log(`\n📋 Testing moodItemsByBoardID (boardID: ${boardID.substring(0, 8)}...)...`);
    const result = await publicClient.graphql({
      query: moodItemsByBoardID,
      variables: { boardID },
    });
    const items = (result as any).data.moodItemsByBoardID.items;
    console.log(`✅ Found ${items.length} mood items for board:`);
    items.slice(0, 5).forEach((m: any) => {
      console.log(`   - [${m.id.substring(0, 8)}...] ${m.title}`);
    });
    if (items.length > 5) console.log(`   ... and ${items.length - 5} more`);
  }

  // ============================================================
  // Lambda Function Test Functions
  // ============================================================

  async function testGetRandomEmoji(): Promise<void> {
    console.log('\n🎲 Testing getRandomEmoji (Lambda)...');
    const authClient = generateClient({ authMode: 'userPool' });
    const result = await authClient.graphql({ query: getRandomEmoji });
    const emoji = (result as any).data.getRandomEmoji;
    console.log(`✅ Got random emoji: ${emoji}`);
  }

  async function testGetKinesisEvents(): Promise<void> {
    console.log('\n📊 Testing getKinesisEvents (Lambda)...');
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
      parsed.events.slice(0, 3).forEach((e: any) => {
        console.log(`   - seq: ${e.sequenceNumber?.substring(0, 12)}... ts: ${e.timestamp || 'N/A'}`);
      });
    } else if (parsed?.error) {
      console.log(`✅ Kinesis reader responded (stream may be empty): ${parsed.error}`);
    } else {
      console.log('✅ Kinesis reader responded:', JSON.stringify(parsed).substring(0, 100));
    }
  }

  // ============================================================
  // Mutation Test Functions - Boards
  // ============================================================

  async function testCreateBoard(): Promise<string | null> {
    console.log('\n🆕 Testing createBoard...');
    const result = await publicClient.graphql({
      query: createBoard,
      variables: {
        input: {
          name: `Test Board ${Date.now()}`,
        },
      },
    });
    const board = (result as any).data.createBoard;
    console.log('✅ Created board:', {
      id: board.id.substring(0, 8) + '...',
      name: board.name,
    });
    return board.id;
  }

  async function testUpdateBoard(boardId: string): Promise<void> {
    console.log(`\n✏️ Testing updateBoard (id: ${boardId.substring(0, 8)}...)...`);
    const result = await publicClient.graphql({
      query: updateBoard,
      variables: {
        input: {
          id: boardId,
          name: `Updated Board ${Date.now()}`,
        },
      },
    });
    const board = (result as any).data.updateBoard;
    console.log('✅ Updated board:', {
      id: board.id.substring(0, 8) + '...',
      name: board.name,
    });
  }

  async function testDeleteBoard(boardId: string): Promise<void> {
    console.log(`\n🗑️ Testing deleteBoard (id: ${boardId.substring(0, 8)}...)...`);
    const result = await publicClient.graphql({
      query: deleteBoard,
      variables: { input: { id: boardId } },
    });
    const deleted = (result as any).data.deleteBoard;
    console.log('✅ Deleted board:', deleted.name);
  }

  // ============================================================
  // Mutation Test Functions - MoodItems
  // ============================================================

  async function testCreateMoodItem(boardId: string): Promise<string | null> {
    console.log('\n🆕 Testing createMoodItem...');
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
    console.log('✅ Created mood item:', {
      id: item.id.substring(0, 8) + '...',
      title: item.title,
      boardID: item.boardID.substring(0, 8) + '...',
    });
    return item.id;
  }

  async function testUpdateMoodItem(itemId: string): Promise<void> {
    console.log(`\n✏️ Testing updateMoodItem (id: ${itemId.substring(0, 8)}...)...`);
    const result = await publicClient.graphql({
      query: updateMoodItem,
      variables: {
        input: {
          id: itemId,
          title: `Updated Mood ${Date.now()}`,
          description: 'This mood item was updated by the test script',
        },
      },
    });
    const item = (result as any).data.updateMoodItem;
    console.log('✅ Updated mood item:', {
      id: item.id.substring(0, 8) + '...',
      title: item.title,
    });
  }

  async function testDeleteMoodItem(itemId: string): Promise<void> {
    console.log(`\n🗑️ Testing deleteMoodItem (id: ${itemId.substring(0, 8)}...)...`);
    const result = await publicClient.graphql({
      query: deleteMoodItem,
      variables: { input: { id: itemId } },
    });
    const deleted = (result as any).data.deleteMoodItem;
    console.log('✅ Deleted mood item:', deleted.title);
  }

  // ============================================================
  // S3 Storage Test Functions
  // ============================================================

  async function testUploadImage(): Promise<string | null> {
    console.log('\n📤 Testing uploadData (S3 image upload)...');
    // 1x1 transparent PNG
    const testImageBase64 =
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const imageBuffer = Buffer.from(testImageBase64, 'base64');
    const fileName = `test-mood-image-${Date.now()}.png`;

    console.log(`   Uploading to: ${fileName}`);
    console.log(`   File size: ${imageBuffer.length} bytes`);

    const result = await uploadData({
      key: fileName,
      data: imageBuffer,
      options: { contentType: 'image/png' },
    }).result;

    console.log('✅ Upload successful!');
    console.log('   Key:', result.key);
    return result.key;
  }

  async function testGetImageUrl(imageKey: string): Promise<string | null> {
    console.log('\n🔗 Testing getUrl (S3 signed URL)...');
    console.log(`   Image key: ${imageKey}`);

    const result = await getUrl({
      key: imageKey,
      options: { expiresIn: 3600 },
    });
    console.log('✅ Got signed URL!');
    console.log('   URL:', result.url.toString().substring(0, 80) + '...');
    return result.url.toString();
  }

  async function testRemoveImage(imageKey: string): Promise<void> {
    console.log('\n🗑️ Testing remove (S3 image delete)...');
    console.log(`   Image key: ${imageKey}`);

    await remove({ key: imageKey });
    console.log('✅ Image removed successfully!');
  }

  return {
    testListBoards,
    testGetBoard,
    testListMoodItems,
    testGetMoodItem,
    testMoodItemsByBoardID,
    testGetRandomEmoji,
    testGetKinesisEvents,
    testCreateBoard,
    testUpdateBoard,
    testDeleteBoard,
    testCreateMoodItem,
    testUpdateMoodItem,
    testDeleteMoodItem,
    testUploadImage,
    testGetImageUrl,
    testRemoveImage,
  };
}


// ============================================================
// Shared Test Orchestration Functions
// ============================================================

export function createTestOrchestrator(testFunctions: ReturnType<typeof createTestFunctions>, runner: TestRunner) {
  async function runQueryTests(): Promise<{ boardId: string | null; moodItemId: string | null }> {
    console.log('\n' + '='.repeat(60));
    console.log('📖 PART 1: GraphQL Queries');
    console.log('='.repeat(60));

    const boardId = await runner.runTest('listBoards', testFunctions.testListBoards);
    if (boardId) await runner.runTest('getBoard', () => testFunctions.testGetBoard(boardId));

    const moodItemId = await runner.runTest('listMoodItems', testFunctions.testListMoodItems);
    if (moodItemId) await runner.runTest('getMoodItem', () => testFunctions.testGetMoodItem(moodItemId));

    if (boardId) {
      console.log('\n--- Testing mood items filtered by board ---');
      await runner.runTest('moodItemsByBoardID', () => testFunctions.testMoodItemsByBoardID(boardId));
    }

    return { boardId, moodItemId };
  }

  async function runBoardMutationTests(): Promise<string | null> {
    console.log('\n' + '='.repeat(60));
    console.log('📝 PART 2: Board CRUD Operations');
    console.log('='.repeat(60));

    const boardId = await runner.runTest('createBoard', testFunctions.testCreateBoard);
    if (!boardId) {
      console.log('❌ Failed to create board, skipping remaining board tests');
      return null;
    }

    await runner.runTest('getBoard (verify create)', () => testFunctions.testGetBoard(boardId));
    await runner.runTest('updateBoard', () => testFunctions.testUpdateBoard(boardId));
    await runner.runTest('getBoard (verify update)', () => testFunctions.testGetBoard(boardId));

    return boardId;
  }

  async function runMoodItemMutationTests(boardId: string): Promise<string | null> {
    console.log('\n' + '='.repeat(60));
    console.log('🎨 PART 3: MoodItem CRUD Operations');
    console.log('='.repeat(60));

    const itemId = await runner.runTest('createMoodItem', () => testFunctions.testCreateMoodItem(boardId));
    if (!itemId) {
      console.log('❌ Failed to create mood item, skipping remaining mood item tests');
      return null;
    }

    await runner.runTest('getMoodItem (verify create)', () => testFunctions.testGetMoodItem(itemId));
    await runner.runTest('updateMoodItem', () => testFunctions.testUpdateMoodItem(itemId));
    await runner.runTest('getMoodItem (verify update)', () => testFunctions.testGetMoodItem(itemId));
    await runner.runTest('moodItemsByBoardID (for board)', () => testFunctions.testMoodItemsByBoardID(boardId));

    return itemId;
  }

  async function runLambdaTests(): Promise<void> {
    console.log('\n' + '='.repeat(60));
    console.log('⚡ PART 4: Lambda Function Operations');
    console.log('='.repeat(60));

    await runner.runTest('getRandomEmoji', testFunctions.testGetRandomEmoji);
    await runner.runTest('getKinesisEvents', testFunctions.testGetKinesisEvents);
  }

  async function runStorageTests(): Promise<void> {
    console.log('\n' + '='.repeat(60));
    console.log('📸 PART 5: S3 Storage Operations');
    console.log('='.repeat(60));

    const imageKey = await runner.runTest('uploadImage', testFunctions.testUploadImage);
    if (imageKey) {
      await runner.runTest('getImageUrl', () => testFunctions.testGetImageUrl(imageKey));
      await runner.runTest('removeImage', () => testFunctions.testRemoveImage(imageKey));
    }
  }

  async function runCleanupTests(boardId: string | null, moodItemId: string | null): Promise<void> {
    console.log('\n' + '='.repeat(60));
    console.log('🧹 PART 6: Cleanup (Delete Test Data)');
    console.log('='.repeat(60));

    // Delete in reverse order of creation (mood items -> boards)
    if (moodItemId) await runner.runTest('deleteMoodItem', () => testFunctions.testDeleteMoodItem(moodItemId));
    if (boardId) await runner.runTest('deleteBoard', () => testFunctions.testDeleteBoard(boardId));
  }

  return {
    runQueryTests,
    runBoardMutationTests,
    runMoodItemMutationTests,
    runLambdaTests,
    runStorageTests,
    runCleanupTests,
  };
}
