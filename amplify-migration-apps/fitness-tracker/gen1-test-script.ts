/**
 * Gen1 Test Script for Fitness Tracker App
 *
 * This script tests all functionality:
 * 1. Authenticated GraphQL Queries (requires auth)
 * 2. Authenticated GraphQL Mutations (requires auth)
 * 3. REST API Operations (nutrition logging)
 *
 * IMPORTANT: Update TEST_USER credentials before running tests.
 */

// Polyfill crypto for Node.js environment (required for Amplify Auth)
import { webcrypto } from 'crypto';
if (typeof globalThis.crypto === 'undefined') {
  (globalThis as any).crypto = webcrypto;
}

import { Amplify } from 'aws-amplify';
import { getCurrentUser } from 'aws-amplify/auth';
import { post } from 'aws-amplify/api';
import amplifyconfig from './src/amplifyconfiguration.json';
import { createTestRunner, authenticateUser, signOutUser, runQueryTests, runMutationTests } from './test-utils';

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

async function runRestApiTests(): Promise<void> {
  console.log('\n' + '='.repeat(50));
  console.log('🌐 PART 3: REST API Operations');
  console.log('='.repeat(50));

  await runTest('nutritionLogAPI', testNutritionLogAPI);

  console.log('\n💡 Note: The REST API creates meals directly in DynamoDB.');
  console.log('   Check your app to see the logged nutrition data!');
}

async function runAllTests(): Promise<void> {
  console.log('🚀 Starting Gen1 Test Script for Fitness Tracker\n');
  console.log('This script tests:');
  console.log('  1. Authenticated GraphQL Queries');
  console.log('  2. Authenticated GraphQL Mutations');
  console.log('  3. REST API Operations (Nutrition Logging)');

  // Check credentials
  if (TEST_USER.username === 'YOUR_USERNAME_HERE') {
    console.log('\n⚠️  Please update TEST_USER credentials before running!');
    console.log('   Edit the TEST_USER object at the top of this file.');
    return;
  }

  // Authenticate
  const isAuthenticated = await authenticateUser(TEST_USER);
  if (!isAuthenticated) {
    console.log('\n❌ Cannot run tests without authentication');
    return;
  }

  // Part 1: Queries
  await runQueryTests(runTest);

  // Part 2: Mutations
  await runMutationTests(runTest);

  // Part 3: REST API
  await runRestApiTests();

  // Sign out
  await signOutUser();

  // Print summary and exit with appropriate code
  printSummary();
}

// Run all tests
void runAllTests();
