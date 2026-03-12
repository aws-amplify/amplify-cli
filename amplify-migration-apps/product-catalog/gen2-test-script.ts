/**
 * Gen2 Test Script for Product Catalog App
 *
 * This script tests all functionality for Amplify Gen2:
 * 1. GraphQL Queries (Products, Users, Comments, Low Stock Lambda)
 * 2. Product Mutations (Create, Update, Delete)
 * 3. User Mutations (Create, Update Role, Delete)
 * 4. Comment Mutations (Create, Update, Delete)
 * 5. S3 Storage Operations (Upload, Get URL)
 * 6. Role-Based Access Control
 * 7. Business Logic (Filtering, Sorting, Reports)
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
import amplifyconfig from './src/amplify_outputs.json';
import { TestRunner } from '../_test-common/test-apps-test-utils';
import { provisionTestUser } from '../_test-common/signup';
import { createTestFunctions, createTestOrchestrator } from './test-utils';

// Configure Amplify
Amplify.configure(amplifyconfig);

// ============================================================
// Main Test Execution
// ============================================================

async function runAllTests(): Promise<void> {
  console.log('🚀 Starting Product Catalog Gen2 Test Script\n');
  console.log('This script tests:');
  console.log('  1. GraphQL Queries (Products, Users, Comments, Low Stock)');
  console.log('  2. Product Mutations (Create, Update, Delete)');
  console.log('  3. User Mutations (Create, Update Role, Delete)');
  console.log('  4. Comment Mutations (Create, Update, Delete)');
  console.log('  5. S3 Storage Operations (Upload, Get URL)');
  console.log('  6. Role-Based Access Control');
  console.log('  7. Business Logic (Filtering, Sorting, Reports)');

  // Provision user via SDK, then sign in here so tokens stay in this module's Amplify scope
  const { signinValue, testUser } = await provisionTestUser(amplifyconfig);

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
  const {
    runQueryTests,
    runProductMutationTests,
    runUserMutationTests,
    runCommentMutationTests,
    runStorageTests,
    runRBACTests,
    runBusinessLogicTests,
  } = createTestOrchestrator(testFunctions, runner);

  // Part 1: Query tests
  const { productId: existingProductId } = await runQueryTests();

  // Part 2: Product mutations
  const testProductId = await runProductMutationTests();

  // Part 3: User mutations
  await runUserMutationTests();

  // Part 4: Comment mutations (use test product or existing product)
  const productForComments = testProductId || existingProductId;
  if (productForComments) {
    await runCommentMutationTests(productForComments);
  } else {
    console.log('\n⚠️ Skipping comment tests - no product available');
  }

  // Part 5: Storage tests
  await runStorageTests();

  // Part 6: RBAC tests
  await runRBACTests();

  // Part 7: Business logic tests
  await runBusinessLogicTests();

  // Cleanup: delete test product if created
  if (testProductId) {
    console.log('\n🧹 Cleanup: Deleting test product...');
    await runner.runTest('deleteProduct_final', () => testFunctions.testDeleteProduct(testProductId));
  }

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
