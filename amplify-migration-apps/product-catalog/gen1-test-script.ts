/**
 * Gen1 Test Script for Product Catalog App
 *
 * This script tests all functionality for Amplify Gen1:
 * 1. GraphQL Queries (Products, Users, Comments, Low Stock Lambda)
 * 2. GraphQL Mutations (Products, Users, Comments)
 * 3. S3 Storage Operations (Image upload/retrieval)
 * 4. Role-Based Access Control (ADMIN, MANAGER, VIEWER permissions)
 *
 * NOTE: Your API uses IAM authorization - all operations require authentication first.
 *
 * IMPORTANT: Update TEST_USER credentials before running tests.
 */

// Polyfill crypto for Node.js environment (required for Amplify Auth)
import { webcrypto } from 'crypto';
if (typeof globalThis.crypto === 'undefined') {
  (globalThis as any).crypto = webcrypto;
}

import { Amplify } from 'aws-amplify';

// Import Amplify Gen1 configuration
import amplifyconfig from './src/amplifyconfiguration.json';

// Import shared test utilities
import {
  createTestRunner,
  authenticateUser,
  signOutUser,
  runQueryTests,
  runProductMutationTests,
  runUserMutationTests,
  runCommentMutationTests,
  runStorageTests,
  runRBACTests,
  runBusinessLogicTests,
} from './test-utils';

// Configure Amplify with Gen1 config
Amplify.configure(amplifyconfig);

// Initialize test runner
const { runTest, printSummary } = createTestRunner();

// ============================================================
// CONFIGURATION - Update with your test user credentials
// ============================================================
const TEST_USER = {
  username: 'YOUR_EMAIL@example.com',
  password: 'YOUR_PASSWORD',
};

// ============================================================
// Main Test Runner
// ============================================================

async function runAllTests(): Promise<void> {
  console.log('🚀 Starting Product Catalog Gen1 Test Script\n');
  console.log('This script tests:');
  console.log('  1. GraphQL Queries (Products, Users, Comments, Low Stock)');
  console.log('  2. Product Mutations (Create, Update, Delete)');
  console.log('  3. User Mutations (Create, Update Role, Delete)');
  console.log('  4. Comment Mutations (Create, Update, Delete)');
  console.log('  5. S3 Storage Operations (Upload, Get URL)');
  console.log('  6. Role-Based Access Control');
  console.log('  7. Business Logic (Filtering, Sorting, Reports)');
  console.log('\n⚠️  NOTE: Your API uses IAM auth - authentication required for ALL operations.');

  // Check credentials
  if (TEST_USER.username === 'YOUR_EMAIL@example.com') {
    console.log('\n⚠️  Please update TEST_USER credentials before running!');
    return;
  }

  // MUST authenticate first - your API requires IAM auth for everything
  const isAuthenticated = await authenticateUser(TEST_USER);
  if (!isAuthenticated) {
    console.log('\n❌ Cannot run tests without authentication');
    console.log('   Please check your TEST_USER credentials.');
    return;
  }

  // Part 1: Query tests
  const { productId: existingProductId } = await runQueryTests(runTest);

  // Part 2: Product mutations
  const testProductId = await runProductMutationTests(runTest);

  // Part 3: User mutations
  await runUserMutationTests(runTest);

  // Part 4: Comment mutations (use test product or existing product)
  const productForComments = testProductId || existingProductId;
  if (productForComments) {
    await runCommentMutationTests(productForComments, runTest);
  } else {
    console.log('\n⚠️ Skipping comment tests - no product available');
  }

  // Part 5: Storage tests
  await runStorageTests(runTest);

  // Part 6: RBAC tests
  await runRBACTests(runTest);

  // Part 7: Business logic tests
  await runBusinessLogicTests(runTest);

  // Cleanup: delete test product if created
  if (testProductId) {
    console.log('\n🧹 Cleanup: Deleting test product...');
    const { testDeleteProduct } = await import('./test-utils');
    await runTest('deleteProduct_final', () => testDeleteProduct(testProductId));
  }

  // Sign out
  await signOutUser();

  // Print summary and exit with appropriate code for GitHub Actions
  printSummary();
}

// Run all tests
void runAllTests();
