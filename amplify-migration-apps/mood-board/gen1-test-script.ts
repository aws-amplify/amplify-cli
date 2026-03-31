/**
 * Gen1 Test Script for Mood Board App
 *
 * This script tests all functionality for Amplify Gen1:
 * 1. GraphQL Queries (Boards, MoodItems)
 * 2. Board CRUD Operations
 * 3. MoodItem CRUD Operations
 * 4. Lambda Function Operations (getRandomEmoji, getKinesisEvents)
 * 5. S3 Storage Operations
 * 6. Cleanup (Delete Test Data)
 *
 * Credentials are provisioned automatically via Cognito AdminCreateUser + AdminSetUserPassword.
 */

// Polyfill crypto for Node.js environment (required for Amplify Auth)
import { webcrypto } from 'crypto';
if (typeof globalThis.crypto === 'undefined') {
  (globalThis as any).crypto = webcrypto;
}

import { Amplify } from 'aws-amplify';
import { signIn, signOut, getCurrentUser } from 'aws-amplify/auth';
import amplifyconfig from './src/amplifyconfiguration.json';
import { TestRunner } from '../_test-common/test-apps-test-utils';
import { provisionTestUser } from '../_test-common/signup';
import { createTestFunctions, createTestOrchestrator } from './test-utils';

// Configure Amplify
Amplify.configure(amplifyconfig);

// ============================================================
// Main Test Execution
// ============================================================

async function runAllTests(): Promise<void> {
  console.log('🚀 Starting Mood Board Gen1 Test Script\n');
  console.log('This script tests:');
  console.log('  1. GraphQL Queries (Boards, MoodItems)');
  console.log('  2. Board CRUD Operations');
  console.log('  3. MoodItem CRUD Operations');
  console.log('  4. Lambda Function Operations (Emoji, Kinesis)');
  console.log('  5. S3 Storage Operations');
  console.log('  6. Cleanup (Delete Test Data)');

  // Provision user via admin APIs, then sign in here so tokens stay in this module's Amplify scope
  const { signinValue, testUser } = await provisionTestUser(amplifyconfig);

  // Sign in from this module so the auth tokens are available to api/storage
  try {
    await signIn({ username: signinValue, password: testUser.password });
    const currentUser = await getCurrentUser();
    console.log(`✅ Signed in as: ${currentUser.username}`);
  } catch (error: any) {
    console.error('❌ SignIn failed:', error.message || error);
    process.exit(1);
  }

  const runner = new TestRunner();
  const testFunctions = createTestFunctions();
  const {
    runQueryTests,
    runBoardMutationTests,
    runMoodItemMutationTests,
    runLambdaTests,
    runStorageTests,
    runCleanupTests,
  } = createTestOrchestrator(testFunctions, runner);

  // Part 1: Query tests
  await runQueryTests();

  // Part 2: Board mutations
  const boardId = await runBoardMutationTests();

  // Part 3: MoodItem mutations (requires board)
  let moodItemId: string | null = null;
  if (boardId) {
    moodItemId = await runMoodItemMutationTests(boardId);
  }

  // Part 4: Lambda functions (requires auth)
  await runLambdaTests();

  // Part 5: S3 Storage
  await runStorageTests();

  // Part 6: Cleanup
  await runCleanupTests(boardId, moodItemId);

  // Sign out
  try {
    await signOut();
    console.log('✅ Signed out successfully');
  } catch (error: any) {
    console.error('❌ Sign out error:', error.message || error);
  }

  // Print summary and exit with appropriate code
  runner.printSummary();
}

// Run all tests
void runAllTests();
