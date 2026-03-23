/**
 * Gen1 Test Script for Discussions App
 *
 * This script tests all functionality for Amplify Gen1:
 * 1. GraphQL Queries (Topics, Posts, Comments)
 * 2. Topic CRUD Operations
 * 3. Post CRUD Operations
 * 4. Comment CRUD Operations
 * 5. User Activity Tracking
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
  console.log('🚀 Starting Discussions App Gen1 Test Script\n');
  console.log('This script tests:');
  console.log('  1. GraphQL Queries (Topics, Posts, Comments)');
  console.log('  2. Topic CRUD Operations');
  console.log('  3. Post CRUD Operations');
  console.log('  4. Comment CRUD Operations');
  console.log('  5. User Activity Tracking');
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
  const { runQueryTests, runTopicMutationTests, runPostMutationTests, runCommentMutationTests, runActivityTests, runCleanupTests } =
    createTestOrchestrator(testFunctions, runner);

  // Get current user ID for activity tests
  const currentUser = await getCurrentUser();

  // Part 1: Query tests
  await runQueryTests();

  // Part 2: Topic mutations
  const topicId = await runTopicMutationTests();

  // Part 3: Post mutations (requires topic)
  let postId: string | null = null;
  if (topicId) {
    postId = await runPostMutationTests(topicId);
  }

  // Part 4: Comment mutations (requires post)
  let commentId: string | null = null;
  if (postId) {
    commentId = await runCommentMutationTests(postId);
  }

  // Part 5: Activity tests
  await runActivityTests(currentUser.userId);

  // Part 6: Cleanup
  await runCleanupTests(topicId, postId, commentId);

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
