/**
 * Gen1 Test Script for Fitness Tracker App
 *
 * This script tests all functionality:
 * 1. Authenticated GraphQL Queries (requires auth)
 * 2. Authenticated GraphQL Mutations (requires auth)
 * 3. REST API Operations (nutrition logging)
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
import { post } from 'aws-amplify/api';
import amplifyconfig from './src/amplifyconfiguration.json';
import { TestRunner, provisionTestUser } from '../shared-test-utils/test-apps-test-utils';
import testCredentials from '../shared-test-utils/test-credentials.json';
import { createTestFunctions, createTestOrchestrator } from './test-utils';

// Configure Amplify
Amplify.configure(amplifyconfig);

// ============================================================
// REST API Test Functions (Gen1-specific)
// ============================================================
async function testNutritionLogAPI(): Promise<void> {
  console.log('\n🍔 Testing REST API - POST /nutrition/log...');
  const user = await getCurrentUser();

  const restOperation = post({
    apiName: 'nutritionapi',
    path: '/nutrition/log',
    options: {
      body: {
        userName: user.username,
        content: `Test nutrition log via REST API - Pizza and salad - ${Date.now()}`,
      },
    },
  });

  const { body } = await restOperation.response;
  const response = await body.json();

  console.log('✅ REST API Response:', response);
  console.log('   Message:', (response as any).message);
}


// ============================================================
// Main Test Execution
// ============================================================

async function runAllTests(): Promise<void> {
  console.log('🚀 Starting Gen1 Test Script for Fitness Tracker\n');
  console.log('This script tests:');
  console.log('  1. Authenticated GraphQL Queries');
  console.log('  2. Authenticated GraphQL Mutations');
  console.log('  3. REST API Operations (Nutrition Logging)');

  // Provision user via SDK, then sign in here so tokens stay in this module's Amplify scope
  const { signinValue, testUser } = await provisionTestUser(amplifyconfig, testCredentials);

  // Sign in from this module so the auth tokens are available to api/storage
  try {
    await signIn({ username: signinValue, password: testUser.password });
    const currentUser = await getCurrentUser();
    console.log(`✅ Signed in as: ${currentUser.username}`);
  } catch (error: any) {
    console.error('❌ SignIn has failed:', error.message || error);
    process.exit(1);
  }

  const runner = new TestRunner();
  const testFunctions = createTestFunctions();
  const { runQueryTests, runMutationTests } = createTestOrchestrator(testFunctions, runner);

  // Part 1: Queries
  await runQueryTests();

  // Part 2: Mutations
  await runMutationTests();

  // Part 3: REST API
  console.log('\n' + '='.repeat(50));
  console.log('🌐 PART 3: REST API Operations');
  console.log('='.repeat(50));

  await runner.runTest('nutritionLogAPI', testNutritionLogAPI);

  console.log('\n💡 Note: The REST API creates meals directly in DynamoDB.');
  console.log('   Check your app to see the logged nutrition data!');

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
