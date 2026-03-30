/**
 * Gen2 Test Script for Store Locator App
 *
 * This script tests geo functionality against the Gen2 backend:
 * 1. Location Search (Place Index) -- searchByText, searchByCoordinates
 * 2. Geofence Operations -- save, get, list, delete
 *
 * Credentials are provisioned automatically via Cognito
 * AdminCreateUser + AdminSetUserPassword. Since AdminCreateUser
 * does not trigger the PostConfirmation Lambda, the script
 * manually adds the user to the storeLocatorAdmin group to
 * grant geofence CRUD permissions.
 *
 * IMPORTANT: Place your Gen2 amplify_outputs.json in src/ before running.
 */

// Polyfill crypto for Node.js environment (required for Amplify Auth)
import { webcrypto } from 'crypto';
if (typeof globalThis.crypto === 'undefined') {
  (globalThis as any).crypto = webcrypto;
}

import { Amplify } from 'aws-amplify';
import { signIn, signOut, getCurrentUser } from 'aws-amplify/auth';
import {
  CognitoIdentityProviderClient,
  AdminAddUserToGroupCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import amplifyconfig from './src/amplify_outputs.json';
import { TestRunner } from '../_test-common/test-apps-test-utils';
import { provisionTestUser } from '../_test-common/signup';
import { createTestFunctions, createTestOrchestrator } from './test-utils';

// Configure Amplify with Gen2 configuration (overrides the Gen1 config in test-utils)
Amplify.configure(amplifyconfig);

// ============================================================
// Main Test Execution
// ============================================================

async function runAllTests(): Promise<void> {
  console.log('🚀 Starting Store Locator Gen2 Test Script\n');
  console.log('This script tests:');
  console.log('  1. Location Search (Place Index)');
  console.log('  2. Geofence Operations (CRUD)');

  // Provision user via admin APIs, then sign in here so tokens stay in this module's Amplify scope
  const gen2Auth = (amplifyconfig as any).auth;
  const gen1Compat = {
    aws_user_pools_id: gen2Auth.user_pool_id,
    aws_user_pools_web_client_id: gen2Auth.user_pool_client_id,
    aws_cognito_region: gen2Auth.aws_region,
    aws_cognito_username_attributes: gen2Auth.username_attributes?.map((a: string) => a.toUpperCase()) ?? [],
    aws_cognito_signup_attributes: gen2Auth.standard_required_attributes?.map((a: string) => a.toUpperCase()) ?? [],
  };
  const { signinValue, testUser } = await provisionTestUser(gen1Compat);

  // AdminCreateUser does not fire the PostConfirmation trigger, so
  // manually add the user to storeLocatorAdmin for geofence permissions.
  try {
    const cognitoClient = new CognitoIdentityProviderClient({
      region: gen2Auth.aws_region,
    });
    await cognitoClient.send(
      new AdminAddUserToGroupCommand({
        UserPoolId: gen2Auth.user_pool_id,
        Username: signinValue,
        GroupName: 'storeLocatorAdmin',
      }),
    );
    console.log('✅ Added user to storeLocatorAdmin group');
  } catch (error: any) {
    console.error('❌ Failed to add user to group:', error.message || error);
    process.exit(1);
  }

  // Sign in from this module so the auth tokens are available to Geo
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
  const { runSearchTests, runGeofenceTests } = createTestOrchestrator(testFunctions, runner);

  // Part 1: Location Search
  await runSearchTests();

  // Part 2: Geofence Operations
  await runGeofenceTests();

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
