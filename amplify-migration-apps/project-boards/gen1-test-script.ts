/**
 * Gen1 Test Script for Project Boards App
 *
 * This script tests all functionality for Amplify Gen1:
 * 1. Public GraphQL Queries (no auth required)
 * 2. Authenticated GraphQL Mutations (requires auth)
 * 3. S3 Storage Operations (requires auth)
 *
 * Credentials are provisioned automatically via Cognito SignUp + AdminConfirmSignUp.
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
import testCredentials from '../_test-common/test-credentials.json';
import { createTestFunctions, createTestOrchestrator } from './test-utils';

// Configure Amplify
Amplify.configure(amplifyconfig);

// ============================================================
// Main Test Execution
// ============================================================

async function runAllTests(): Promise<void> {
  console.log('🚀 Starting Gen1 Test Script\n');
  console.log('This script tests:');
  console.log('  1. Public GraphQL Queries');
  console.log('  2. Authenticated GraphQL Mutations');
  console.log('  3. S3 Storage Operations');

  // Provision user via SDK, then sign in here so tokens stay in this module's Amplify scope
  const { signinValue, testUser } = await provisionTestUser(amplifyconfig, testCredentials);

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
  const { runPublicQueryTests, runMutationTests, runStorageTests } = createTestOrchestrator(testFunctions, runner);

  // Part 1: Public queries (no auth needed)
  await runPublicQueryTests();

  // Part 2: Mutations (already authenticated)
  await runMutationTests();

  // Part 3: Storage
  await runStorageTests();

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
