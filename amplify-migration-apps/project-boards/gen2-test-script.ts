/**
 * Gen2 Test Script for Project Boards App
 *
 * This script tests all functionality for Amplify Gen2:
 * 1. Public GraphQL Queries (no auth required)
 * 2. Authenticated GraphQL Mutations (requires auth)
 * 3. S3 Storage Operations (requires auth)
 *
 * IMPORTANT: Update TEST_USER credentials before running authenticated tests.
 */

// Polyfill crypto for Node.js environment (required for Amplify Auth)
import { webcrypto } from 'crypto';
if (typeof globalThis.crypto === 'undefined') {
  (globalThis as any).crypto = webcrypto;
}

import { Amplify } from 'aws-amplify';
import amplifyconfig from './src/amplify_outputs.json';
import { createTestRunner, createTestFunctions, createTestOrchestrator } from './test-utils';

// Configure Amplify
Amplify.configure(amplifyconfig);

// ============================================================
// CONFIGURATION - Update with your test user credentials
// ============================================================
const TEST_USER = {
  username: 'YOUR_USERNAME_HERE',
  password: 'YOUR_PASSWORD_HERE',
};

// ============================================================
// Main Test Execution
// ============================================================

async function runAllTests(): Promise<void> {
  console.log('🚀 Starting Gen2 Test Script\n');
  console.log('This script tests:');
  console.log('  1. Public GraphQL Queries');
  console.log('  2. Authenticated GraphQL Mutations');
  console.log('  3. S3 Storage Operations');

  // Check credentials
  if (TEST_USER.username === 'YOUR_USERNAME_HERE') {
    console.log('\n⚠️  Please update TEST_USER credentials before running!');
    return;
  }

  // Initialize test runner and functions
  const { runTest, printSummary } = createTestRunner();
  const testFunctions = createTestFunctions(TEST_USER);
  const { runPublicQueryTests, runMutationTests, runStorageTests } = createTestOrchestrator(testFunctions, runTest);

  // Part 1: Public queries (no auth needed)
  await runPublicQueryTests();

  // Authenticate for parts 2 and 3
  const isAuthenticated = await testFunctions.authenticateUser();
  if (!isAuthenticated) {
    console.log('\n❌ Cannot run authenticated tests without authentication');
    return;
  }

  // Part 2: Mutations
  await runMutationTests();

  // Part 3: Storage
  await runStorageTests();

  // Sign out
  await testFunctions.signOutUser();

  // Print summary and exit with appropriate code
  printSummary();
}

// Run all tests
void runAllTests();
