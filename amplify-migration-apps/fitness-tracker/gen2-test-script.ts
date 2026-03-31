/**
 * Gen2 Test Script for Fitness Tracker App
 *
 * This script tests all functionality for Amplify Gen2:
 * 1. Authenticated GraphQL Queries (requires auth)
 * 2. Authenticated GraphQL Mutations (requires auth)
 * 3. REST API Operations (nutrition logging)
 *
 * Credentials are provisioned automatically via Cognito AdminCreateUser.
 */

// Polyfill crypto for Node.js environment (required for Amplify Auth)
import { webcrypto } from 'crypto';
if (typeof globalThis.crypto === 'undefined') {
  (globalThis as any).crypto = webcrypto;
}

import { Amplify } from 'aws-amplify';
import { signIn, signOut, getCurrentUser, fetchAuthSession } from 'aws-amplify/auth';
import { parseAmplifyConfig } from 'aws-amplify/utils';
import amplifyconfig from './src/amplify_outputs.json';
import { SignatureV4 } from '@aws-sdk/signature-v4';
import { HttpRequest } from '@aws-sdk/protocol-http';
import { Sha256 } from '@aws-crypto/sha256-js';
import { TestRunner } from '../_test-common/test-apps-test-utils';
import { provisionTestUser } from '../_test-common/signup';
import { createTestFunctions, createTestOrchestrator } from './test-utils';

// Configure Amplify with Gen2 outputs, merging REST API config
const parsedConfig = parseAmplifyConfig(amplifyconfig);
Amplify.configure({
  ...parsedConfig,
  API: {
    ...parsedConfig.API,
    REST: {
      ...(amplifyconfig as any).custom?.API,
    },
  },
});

// ============================================================
// REST API Test Functions (Gen2-specific, uses SigV4 signing)
// ============================================================

/**
 * Make a signed REST API request using AWS SigV4.
 * Gen2 REST APIs require manual signing since Amplify's post() helper
 * has signing issues in Node.js environments.
 */
async function makeSignedRequest(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  path: string,
  body?: any,
): Promise<any> {
  const session = await fetchAuthSession();
  const credentials = session.credentials;

  if (!credentials) {
    throw new Error('No credentials available');
  }

  const apiConfigs = (amplifyconfig as any).custom.API;
  const apiName = Object.keys(apiConfigs)[0];
  const apiConfig = apiConfigs[apiName];
  let endpoint = apiConfig.endpoint;
  const region = apiConfig.region;

  if (endpoint.endsWith('/')) {
    endpoint = endpoint.slice(0, -1);
  }

  const normalizedPath = path.startsWith('/') ? path : '/' + path;
  const url = new URL(endpoint + normalizedPath);

  console.log('   🔗 Request URL:', url.toString());

  const request = new HttpRequest({
    method,
    protocol: url.protocol,
    hostname: url.hostname,
    path: url.pathname + url.search,
    headers: {
      'Content-Type': 'application/json',
      host: url.hostname,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const signer = new SignatureV4({
    credentials,
    region,
    service: 'execute-api',
    sha256: Sha256,
  });

  const signedRequest = await signer.sign(request);

  const response = await fetch(url.toString(), {
    method: signedRequest.method,
    headers: signedRequest.headers,
    body: signedRequest.body,
  });

  const responseText = await response.text();
  console.log('   📥 Response status:', response.status);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${responseText}`);
  }

  return JSON.parse(responseText);
}

async function testNutritionLogAPI(): Promise<void> {
  console.log('\n🍔 Testing Gen2 REST API - POST /nutrition/log...');
  const user = await getCurrentUser();

  const requestBody = {
    userName: user.username,
    content: `Test nutrition log via Gen2 REST API - Pizza and salad - ${Date.now()}`,
  };

  const response = await makeSignedRequest('POST', 'nutrition/log', requestBody);
  console.log('✅ Gen2 REST API Response:', response);
  console.log('   Message:', response.message);
}

// ============================================================
// Main Test Execution
// ============================================================

async function runAllTests(): Promise<void> {
  console.log('🚀 Starting Gen2 Test Script for Fitness Tracker\n');
  console.log('This script tests:');
  console.log('  1. Authenticated GraphQL Queries');
  console.log('  2. Authenticated GraphQL Mutations');
  console.log('  3. REST API Operations (Nutrition Logging)');

  // Provision user via admin APIs, then sign in here so tokens stay in this module's Amplify scope
  const { signinValue, testUser } = await provisionTestUser(amplifyconfig);

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
  const { runQueryTests, runMutationTests } = createTestOrchestrator(testFunctions, runner);

  // Part 1: Queries
  await runQueryTests();

  // Part 2: Mutations
  await runMutationTests();

  // Part 3: REST API (gen2-specific, uses SigV4 signing)
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
