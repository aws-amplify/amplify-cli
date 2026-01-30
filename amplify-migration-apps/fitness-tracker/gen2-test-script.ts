/**
 * Consolidated Test Script for Fitness Tracker App
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

import { generateClient } from 'aws-amplify/api';
import { Amplify } from 'aws-amplify';
import { signIn, signOut, getCurrentUser, fetchAuthSession } from 'aws-amplify/auth';
import { parseAmplifyConfig } from 'aws-amplify/utils';
import amplifyconfig from './src/amplify_outputs.json';
import { SignatureV4 } from '@aws-sdk/signature-v4';
import { HttpRequest } from '@aws-sdk/protocol-http';
import { Sha256 } from '@aws-crypto/sha256-js';
import { getWorkoutProgram, getExercise, getMeal, listWorkoutPrograms, listExercises, listMeals } from './src/graphql/queries';
import {
  createWorkoutProgram,
  updateWorkoutProgram,
  deleteWorkoutProgram,
  createExercise,
  updateExercise,
  deleteExercise,
  createMeal,
  updateMeal,
  deleteMeal,
} from './src/graphql/mutations';
import { WorkoutProgramStatus } from './src/API';
import { createTestRunner } from './test-utils';

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
// Authentication Helper Functions
// ============================================================
async function authenticateUser(): Promise<boolean> {
  console.log('\n🔐 Authenticating user...');
  try {
    await signIn({
      username: TEST_USER.username,
      password: TEST_USER.password,
    });
    const user = await getCurrentUser();
    console.log(`✅ Signed in as: ${user.username}`);
    return true;
  } catch (error: any) {
    if (error.name === 'UserAlreadyAuthenticatedException') {
      const user = await getCurrentUser();
      console.log(`✅ Already signed in as: ${user.username}`);
      return true;
    }
    console.log('❌ Authentication failed:', error.message || error);
    return false;
  }
}

async function signOutUser(): Promise<void> {
  console.log('\n🚪 Signing out...');
  try {
    await signOut();
    console.log('✅ Signed out successfully');
  } catch (error) {
    console.log('❌ Sign out error:', error);
  }
}

// ============================================================
// Query Test Functions
// ============================================================
async function testListWorkoutPrograms(): Promise<string | null> {
  console.log('\n📋 Testing listWorkoutPrograms...');
  const authClient = generateClient({ authMode: 'userPool' });
  const result = await authClient.graphql({ query: listWorkoutPrograms });
  const programs = (result as any).data.listWorkoutPrograms.items;
  console.log(`✅ Found ${programs.length} workout programs:`);
  programs.forEach((p: any) => console.log(`   - [${p.id}] ${p.title} (${p.status})${p.deadline ? ` - Due: ${p.deadline}` : ''}`));
  return programs.length > 0 ? programs[0].id : null;
}

async function testListExercises(): Promise<string | null> {
  console.log('\n💪 Testing listExercises...');
  const authClient = generateClient({ authMode: 'userPool' });
  const result = await authClient.graphql({ query: listExercises });
  const exercises = (result as any).data.listExercises.items;
  console.log(`✅ Found ${exercises.length} exercises:`);
  exercises.forEach((e: any) =>
    console.log(`   - [${e.id}] ${e.name}${e.workoutProgramId ? ` (Program: ${e.workoutProgramId})` : ' (Unassigned)'}`),
  );
  return exercises.length > 0 ? exercises[0].id : null;
}

async function testListMeals(): Promise<string | null> {
  console.log('\n🍽️  Testing listMeals...');
  const apiKeyClient = generateClient({ authMode: 'apiKey' });
  const result = await apiKeyClient.graphql({ query: listMeals });
  const meals = (result as any).data.listMeals.items;
  console.log(`✅ Found ${meals.length} meals:`);
  meals.forEach((m: any) => console.log(`   - [${m.id}] ${m.userName}: ${m.content} (${m.timestamp})`));
  return meals.length > 0 ? meals[0].id : null;
}

async function testGetWorkoutProgram(id: string) {
  console.log(`\n🔍 Testing getWorkoutProgram (id: ${id})...`);
  const authClient = generateClient({ authMode: 'userPool' });
  const result = await authClient.graphql({
    query: getWorkoutProgram,
    variables: { id },
  });
  const program = (result as any).data.getWorkoutProgram;
  console.log('✅ Workout Program:', {
    id: program.id,
    title: program.title,
    status: program.status,
    deadline: program.deadline,
    owner: program.owner,
  });
}

async function testGetExercise(id: string) {
  console.log(`\n🔍 Testing getExercise (id: ${id})...`);
  const authClient = generateClient({ authMode: 'userPool' });
  const result = await authClient.graphql({
    query: getExercise,
    variables: { id },
  });
  console.log('✅ Exercise:', (result as any).data.getExercise);
}

async function testGetMeal(id: string) {
  console.log(`\n🔍 Testing getMeal (id: ${id})...`);
  const apiKeyClient = generateClient({ authMode: 'apiKey' });
  const result = await apiKeyClient.graphql({
    query: getMeal,
    variables: { id },
  });
  console.log('✅ Meal:', (result as any).data.getMeal);
}

// AuthActivity type doesn't exist in schema - removed

// ============================================================
// Mutation Test Functions - Workout Programs
// ============================================================
async function testCreateWorkoutProgram(): Promise<string | null> {
  console.log('\n🆕 Testing createWorkoutProgram...');
  const authClient = generateClient({ authMode: 'userPool' });
  const result = await authClient.graphql({
    query: createWorkoutProgram,
    variables: {
      input: {
        title: `Test Workout Program ${Date.now()}`,
        status: WorkoutProgramStatus.ACTIVE,
        description: 'This is a test workout program created by the test script',
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        color: '#007bff',
      },
    },
  });
  const program = (result as any).data.createWorkoutProgram;
  console.log('✅ Created workout program:', {
    id: program.id,
    title: program.title,
    status: program.status,
    deadline: program.deadline,
    owner: program.owner,
  });
  return program.id;
}

async function testUpdateWorkoutProgram(programId: string): Promise<void> {
  console.log(`\n✏️ Testing updateWorkoutProgram (id: ${programId})...`);
  const authClient = generateClient({ authMode: 'userPool' });
  const result = await authClient.graphql({
    query: updateWorkoutProgram,
    variables: {
      input: {
        id: programId,
        title: 'Updated Test Workout Program',
        description: 'This workout program was updated by the test script',
        status: WorkoutProgramStatus.ON_HOLD,
        color: '#28a745',
      },
    },
  });
  const program = (result as any).data.updateWorkoutProgram;
  console.log('✅ Updated workout program:', {
    id: program.id,
    title: program.title,
    status: program.status,
    color: program.color,
  });
}

async function testDeleteWorkoutProgram(programId: string): Promise<void> {
  console.log(`\n🗑️ Testing deleteWorkoutProgram (id: ${programId})...`);
  const authClient = generateClient({ authMode: 'userPool' });
  const result = await authClient.graphql({
    query: deleteWorkoutProgram,
    variables: { input: { id: programId } },
  });
  const deleted = (result as any).data.deleteWorkoutProgram;
  console.log('✅ Deleted workout program:', deleted.title);
}

// ============================================================
// Mutation Test Functions - Exercises
// ============================================================
async function testCreateExercise(programId?: string): Promise<string | null> {
  console.log('\n🆕 Testing createExercise...');
  const authClient = generateClient({ authMode: 'userPool' });
  const result = await authClient.graphql({
    query: createExercise,
    variables: {
      input: {
        name: `Test Exercise ${Date.now()}`,
        description: 'This is a test exercise created by the test script - 3 sets of 10 reps',
        workoutProgramId: programId || null,
      },
    },
  });
  const exercise = (result as any).data.createExercise;
  console.log('✅ Created exercise:', {
    id: exercise.id,
    name: exercise.name,
    workoutProgramId: exercise.workoutProgramId || 'unassigned',
    owner: exercise.owner,
  });
  return exercise.id;
}

async function testUpdateExercise(exerciseId: string, newProgramId?: string): Promise<void> {
  console.log(`\n✏️ Testing updateExercise (id: ${exerciseId})...`);
  const authClient = generateClient({ authMode: 'userPool' });
  const result = await authClient.graphql({
    query: updateExercise,
    variables: {
      input: {
        id: exerciseId,
        name: 'Updated Test Exercise',
        description: 'This exercise was updated by the test script - 4 sets of 12 reps',
        workoutProgramId: newProgramId || null,
      },
    },
  });
  const exercise = (result as any).data.updateExercise;
  console.log('✅ Updated exercise:', {
    id: exercise.id,
    name: exercise.name,
    workoutProgramId: exercise.workoutProgramId || 'unassigned',
  });
}

async function testDeleteExercise(exerciseId: string): Promise<void> {
  console.log(`\n🗑️ Testing deleteExercise (id: ${exerciseId})...`);
  const authClient = generateClient({ authMode: 'userPool' });
  const result = await authClient.graphql({
    query: deleteExercise,
    variables: { input: { id: exerciseId } },
  });
  const deleted = (result as any).data.deleteExercise;
  console.log('✅ Deleted exercise:', deleted.name);
}

// ============================================================
// Mutation Test Functions - Meals
// ============================================================
async function testCreateMeal(): Promise<string | null> {
  console.log('\n🆕 Testing createMeal...');
  const apiKeyClient = generateClient({ authMode: 'apiKey' });
  const user = await getCurrentUser();
  const result = await apiKeyClient.graphql({
    query: createMeal,
    variables: {
      input: {
        userName: user.username,
        content: `Test meal: Chicken breast, rice, and vegetables - ${Date.now()}`,
        timestamp: new Date().toISOString(),
      },
    },
  });
  const meal = (result as any).data.createMeal;
  console.log('✅ Created meal:', {
    id: meal.id,
    userName: meal.userName,
    content: meal.content,
    timestamp: meal.timestamp,
  });
  return meal.id;
}

async function testUpdateMeal(mealId: string): Promise<void> {
  console.log(`\n✏️ Testing updateMeal (id: ${mealId})...`);
  const apiKeyClient = generateClient({ authMode: 'apiKey' });
  const result = await apiKeyClient.graphql({
    query: updateMeal,
    variables: {
      input: {
        id: mealId,
        content: 'Updated meal: Grilled salmon, quinoa, and steamed broccoli',
      },
    },
  });
  const meal = (result as any).data.updateMeal;
  console.log('✅ Updated meal:', {
    id: meal.id,
    content: meal.content,
  });
}

async function testDeleteMeal(mealId: string): Promise<void> {
  console.log(`\n🗑️ Testing deleteMeal (id: ${mealId})...`);
  const apiKeyClient = generateClient({ authMode: 'apiKey' });
  const result = await apiKeyClient.graphql({
    query: deleteMeal,
    variables: { input: { id: mealId } },
  });
  const deleted = (result as any).data.deleteMeal;
  console.log('✅ Deleted meal:', deleted.content);
}

// ============================================================
// REST API Test Functions
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

  console.log('   � Request URL:', url.toString());
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

// ============================================================
// Main Test Runners
// ============================================================
async function runQueryTests() {
  console.log('\n' + '='.repeat(50));
  console.log('📖 PART 1: Authenticated GraphQL Queries');
  console.log('='.repeat(50));

  const programId = await runTest('listWorkoutPrograms', testListWorkoutPrograms);
  const exerciseId = await runTest('listExercises', testListExercises);
  const mealId = await runTest('listMeals', testListMeals);

  if (programId) await runTest('getWorkoutProgram', () => testGetWorkoutProgram(programId));
  if (exerciseId) await runTest('getExercise', () => testGetExercise(exerciseId));
  if (mealId) await runTest('getMeal', () => testGetMeal(mealId));
}

async function runMutationTests() {
  console.log('\n' + '='.repeat(50));
  console.log('✏️ PART 2: Authenticated GraphQL Mutations');
  console.log('='.repeat(50));

  // Create workout program and exercise
  const programId = await runTest('createWorkoutProgram', testCreateWorkoutProgram);
  const exerciseId = await runTest('createExercise', () => testCreateExercise(programId || undefined));

  // Update workout program and exercise
  if (programId) await runTest('updateWorkoutProgram', () => testUpdateWorkoutProgram(programId));
  if (exerciseId) await runTest('updateExercise', () => testUpdateExercise(exerciseId, programId || undefined));

  // Create, update, and delete meal
  const mealId = await runTest('createMeal', testCreateMeal);
  if (mealId) {
    await runTest('updateMeal', () => testUpdateMeal(mealId));
    await runTest('deleteMeal', () => testDeleteMeal(mealId));
  }

  // Cleanup: delete exercise and workout program
  if (exerciseId) await runTest('deleteExercise', () => testDeleteExercise(exerciseId));
  if (programId) await runTest('deleteWorkoutProgram', () => testDeleteWorkoutProgram(programId));
}

async function runRestApiTests() {
  console.log('\n' + '='.repeat(50));
  console.log('🌐 PART 3: REST API Operations');
  console.log('='.repeat(50));

  await runTest('nutritionLogAPI', testNutritionLogAPI);
}

async function runAllTests() {
  console.log('🚀 Starting Consolidated Test Script for Fitness Tracker\n');
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
  const isAuthenticated = await authenticateUser();
  if (!isAuthenticated) {
    console.log('\n❌ Cannot run tests without authentication');
    return;
  }

  // Part 1: Queries
  await runQueryTests();

  // Part 2: Mutations
  await runMutationTests();

  // Part 3: REST API
  await runRestApiTests();

  // Sign out
  await signOutUser();

  // Print summary and exit with appropriate code
  printSummary();
}

// Run all tests
void runAllTests();
