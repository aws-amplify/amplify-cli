/**
 * Gen1 Test Script for MediaVault App
 *
 * This script tests all functionality:
 * 1. Authenticated GraphQL Queries (requires auth)
 * 2. Authenticated GraphQL Mutations (requires auth)
 * 3. Lambda Function Operations (Thumbnails, User Groups)
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
  console.log('🚀 Starting MediaVault Gen1 Test Script\n');
  console.log('This script tests:');
  console.log('  1. Authenticated GraphQL Queries (Notes)');
  console.log('  2. Authenticated GraphQL Mutations (Notes)');
  console.log('  3. Lambda Function Operations (Thumbnails, User Groups)');

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
  const { runQueryTests, runMutationTests, runLambdaFunctionTests } = createTestOrchestrator(testFunctions, runner);

  // Part 1: Queries
  await runQueryTests();

  // Part 2: Mutations
  await runMutationTests();

  // Part 3: Lambda Functions
  await runLambdaFunctionTests();

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
