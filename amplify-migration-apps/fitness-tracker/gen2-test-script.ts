/**
 * Gen2 Test Script for Fitness Tracker App
 *
 * This script tests all functionality:
 * 1. Authenticated GraphQL Queries (requires auth)
 * 2. Authenticated GraphQL Mutations (requires auth)
 * 3. REST API Operations
 *
 * IMPORTANT: Update TEST_USER credentials before running tests.
 **/

// Polyfill crypto for Node.js environment (required for Amplify Auth)
import { webcrypto } from 'crypto';
if (typeof globalThis.crypto === 'undefined') {
  (globalThis as any).crypto = webcrypto;
}

import { Amplify } from 'aws-amplify';
import { getCurrentUser, fetchAuthSession } from 'aws-amplify/auth';
import { parseAmplifyConfig } from 'aws-amplify/utils';
import amplifyconfig from './src/amplify_outputs.json';
import { SignatureV4 } from '@aws-sdk/signature-v4';
import { HttpRequest } from '@aws-sdk/protocol-http';
import { Sha256 } from '@aws-crypto/sha256-js';
import { createTestRunner, authenticateUser, signOutUser, runQueryTests, runMutationTests } from './test-utils';

// Configure Amplify with Gen2 config
const parsedConfig = parseAmplifyConfig(amplifyconfig);

Amplify.configure({
  ...parsedConfig,
  API: {
    ...parsedConfig.API,
    REST: {
      ...(amplifyconfig as any).custom.API,
    },
  },
});

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
// REST API Test Functions (Gen2-specific)
// ============================================================

/**
 * Helper function to make signed REST API requests using AWS SDK
 * This bypasses Amplify's post() function which has signing issues in Node.js
 */
async function makeSignedRequest(method: 'GET' | 'POST' | 'PUT' | 'DELETE', path: string, body?: any): Promise<any> {
  // Get AWS credentials from Amplify Auth session
  const session = await fetchAuthSession();
  const credentials = session.credentials;

  if (!credentials) {
    throw new Error('No credentials available');
  }

  // Get Gen2 REST API endpoint from config
  const apiConfigs = (amplifyconfig as any).custom.API;
  const apiName = Object.keys(apiConfigs)[0]; // Get first REST API
  const apiConfig = apiConfigs[apiName];
  let endpoint = apiConfig.endpoint;
  const region = apiConfig.region;

  // Remove trailing slash from endpoint if present
  if (endpoint.endsWith('/')) {
    endpoint = endpoint.slice(0, -1);
  }

  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : '/' + path;

  // Construct full URL
  const url = new URL(endpoint + normalizedPath);

  console.log('   🌐 Request URL:', url.toString());
  console.log('   📍 Path:', url.pathname);

  // Create HTTP request
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

  // Sign the request using SigV4
  const signer = new SignatureV4({
    credentials,
    region,
    service: 'execute-api',
    sha256: Sha256,
  });

  const signedRequest = await signer.sign(request);

  // Make the HTTP request
  const response = await fetch(url.toString(), {
    method: signedRequest.method,
    headers: signedRequest.headers,
    body: signedRequest.body,
  });

  const responseText = await response.text();
  console.log('   📥 Response status:', response.status);
  console.log('   📥 Response body:', responseText);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${responseText}`);
  }

  return JSON.parse(responseText);
}

async function testNutritionLogAPI(): Promise<void> {
  console.log('\n🍔 Testing Gen2 REST API - POST /nutrition/log...');
  const user = await getCurrentUser();

  try {
    // Debug: Show what we're sending
    const requestBody = {
      userName: user.username,
      content: `Test nutrition log via Gen2 REST API - Pizza and salad - ${Date.now()}`,
    };
    console.log('   Request body:', JSON.stringify(requestBody));

    // Path relative to the stage (endpoint already includes /prod/)
    const response = await makeSignedRequest('POST', 'nutrition/log', requestBody);

    console.log('✅ Gen2 REST API Response:', response);
    console.log('   Message:', response.message);
  } catch (error: any) {
    console.log('\n⚠️  Gen2 REST API Error:', error.message);
    throw error;
  }
}

async function runRestApiTests(): Promise<void> {
  console.log('\n' + '='.repeat(50));
  console.log('🌐 PART 3: REST API Operations');
  console.log('='.repeat(50));

  await runTest('nutritionLogAPI', testNutritionLogAPI);
}

async function runAllTests(): Promise<void> {
  console.log('🚀 Starting Gen2 Test Script for Fitness Tracker\n');
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
