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
import amplifyconfig from './src/amplifyconfiguration.json';
import { createTestRunner, createTestFunctions, createTestOrchestrator } from './test-utils';
import { CognitoIdentityProviderClient, SignUpCommand, AdminConfirmSignUpCommand } from '@aws-sdk/client-cognito-identity-provider';

// Configure Amplify
Amplify.configure(amplifyconfig);

// ============================================================
// TEST USER PROVISIONING
// ============================================================

/**
 * Creates a test user in Cognito by calling SignUp followed by AdminConfirmSignUp.
 * Reads configuration from the Amplify config file. Fails fast on any error.
 *
 * @returns The generated username and password matching the TestUser interface.
 */
async function createTestUser(): Promise<{ username: string; password: string }> {
  // 1. Read config values from amplifyconfig
  const userPoolId = (amplifyconfig as Record<string, unknown>).aws_user_pools_id as string | undefined;
  const clientId = (amplifyconfig as Record<string, unknown>).aws_user_pools_web_client_id as string | undefined;
  const region = (amplifyconfig as Record<string, unknown>).aws_cognito_region as string | undefined;

  try {
    // 3. Generate unique credentials
    // Use email as the username since the User Pool has EMAIL as a username attribute
    const uniqueId = 'user1';
    const password = 'Password1!';
    const email = `${uniqueId}@test.example.com`;

    console.log(`\n🔑 Creating test user: ${email}`);

    // 4. Instantiate Cognito client with region
    const cognitoClient = new CognitoIdentityProviderClient({ region });

    // 5. Sign up the user (email is the username for this pool)
    await cognitoClient.send(
      new SignUpCommand({
        ClientId: clientId,
        Username: email,
        Password: password,
        UserAttributes: [{ Name: 'email', Value: email }],
      }),
    );
    console.log('✅ SignUp succeeded');

    // 6. Admin-confirm the user to bypass email verification
    await cognitoClient.send(
      new AdminConfirmSignUpCommand({
        UserPoolId: userPoolId,
        Username: email,
      }),
    );
    console.log('✅ AdminConfirmSignUp succeeded');

    // 7. Return credentials matching TestUser interface (username = email for this pool)
    return { username: email, password };
  } catch (error) {
    console.error('❌ Failed to create test user:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// ============================================================
// Main Test Execution
// ============================================================

async function runAllTests(): Promise<void> {
  console.log('🚀 Starting Gen1 Test Script\n');
  console.log('This script tests:');
  console.log('  1. Public GraphQL Queries');
  console.log('  2. Authenticated GraphQL Mutations');
  console.log('  3. S3 Storage Operations');

  // Dynamically provision a test user
  const testUser = await createTestUser();

  // Initialize test runner and functions
  const { runTest, printSummary } = createTestRunner();
  const testFunctions = createTestFunctions(testUser);
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
