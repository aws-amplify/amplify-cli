/* eslint-disable @typescript-eslint/no-explicit-any */
import { generateClient } from 'aws-amplify/api';
import { getCurrentUser, signIn, signOut } from 'aws-amplify/auth';
import { post, get } from 'aws-amplify/api';
import { NUTRITION_API_NAME, ADMIN_API_NAME, configureAmplify } from './src/api-config';
import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  AdminAddUserToGroupCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import * as fs from 'fs';
import { randomBytes } from 'crypto';
import {
  getWorkoutProgram, getExercise, getMeal,
  listWorkoutPrograms, listExercises, listMeals,
} from './src/graphql/queries';
import {
  createWorkoutProgram, updateWorkoutProgram, deleteWorkoutProgram,
  createExercise, updateExercise, deleteExercise,
  createMeal, updateMeal, deleteMeal,
} from './src/graphql/mutations';
import { WorkoutProgramStatus } from './src/API';

// Polyfill crypto for Node.js environment (required for Amplify Auth)
import { webcrypto } from 'crypto';
if (typeof globalThis.crypto === 'undefined') {
  (globalThis as any).crypto = webcrypto;
}


async function main(): Promise<void> {
  const [configPath] = process.argv.slice(2);
  const config = JSON.parse(fs.readFileSync(configPath, { encoding: 'utf-8' }));

  configureAmplify(config);

  const { username, password } = await signUp(config);

  await signIn({ username, password });

  const currentUser = await getCurrentUser();

  console.log('')
  console.log('='.repeat(60));
  console.log('📖 GraphQL Queries (WorkoutPrograms, Exercises, Meals)');
  console.log('='.repeat(60));
  console.log('')

  await testListWorkoutPrograms();
  await testListExercises();
  await testListMeals();

  console.log('')
  console.log('='.repeat(60));
  console.log('🏋️ WorkoutProgram CRUD Operations');
  console.log('='.repeat(60));
  console.log('')

  const programId = await testCreateWorkoutProgram();
  await testGetWorkoutProgram(programId);
  await testUpdateWorkoutProgram(programId);

  console.log('')
  console.log('='.repeat(60));
  console.log('💪 Exercise CRUD Operations');
  console.log('='.repeat(60));
  console.log('')

  const exerciseId = await testCreateExercise(programId);
  await testGetExercise(exerciseId);
  await testUpdateExercise(exerciseId, programId);

  console.log('')
  console.log('='.repeat(60));
  console.log('🍽️ Meal CRUD Operations');
  console.log('='.repeat(60));
  console.log('')

  const mealId = await testCreateMeal(currentUser.username);
  await testGetMeal(mealId);
  await testUpdateMeal(mealId);

  console.log('')
  console.log('='.repeat(60));
  console.log('🌐 REST API Operations');
  console.log('='.repeat(60));
  console.log('')

  await testNutritionLogAPI(currentUser.username);
  await testAdminListUsers();

  console.log('')
  console.log('='.repeat(60));
  console.log('🧹 Cleanup');
  console.log('='.repeat(60));
  console.log('')

  await testDeleteMeal(mealId);
  await testDeleteExercise(exerciseId);
  await testDeleteWorkoutProgram(programId);

  await signOut();
}

main().catch((error) => {
  console.error('Fatal error:', error.message);
  process.exit(1);
});


// ============================================================
// Query Tests
// ============================================================

async function testListWorkoutPrograms(): Promise<void> {
  const client = generateClient({ authMode: 'userPool' });
  console.log('📋 Testing listWorkoutPrograms...');
  const result = await client.graphql({ query: listWorkoutPrograms });
  const programs = (result as any).data.listWorkoutPrograms.items;
  console.log(`✅ Found ${programs.length} workout programs`);
}

async function testGetWorkoutProgram(id: string): Promise<void> {
  const client = generateClient({ authMode: 'userPool' });
  console.log(`🔍 Testing getWorkoutProgram (id: ${id.substring(0, 8)}...)...`);
  const result = await client.graphql({ query: getWorkoutProgram, variables: { id } });
  const program = (result as any).data.getWorkoutProgram;
  console.log('✅ WorkoutProgram:', program.title);
}

async function testListExercises(): Promise<void> {
  const client = generateClient({ authMode: 'userPool' });
  console.log('📋 Testing listExercises...');
  const result = await client.graphql({ query: listExercises });
  const exercises = (result as any).data.listExercises.items;
  console.log(`✅ Found ${exercises.length} exercises`);
}

async function testGetExercise(id: string): Promise<void> {
  const client = generateClient({ authMode: 'userPool' });
  console.log(`🔍 Testing getExercise (id: ${id.substring(0, 8)}...)...`);
  const result = await client.graphql({ query: getExercise, variables: { id } });
  const exercise = (result as any).data.getExercise;
  console.log('✅ Exercise:', exercise.name);
}

async function testListMeals(): Promise<void> {
  const client = generateClient({ authMode: 'apiKey' });
  console.log('📋 Testing listMeals...');
  const result = await client.graphql({ query: listMeals });
  const meals = (result as any).data.listMeals.items;
  console.log(`✅ Found ${meals.length} meals`);
}

async function testGetMeal(id: string): Promise<void> {
  const client = generateClient({ authMode: 'apiKey' });
  console.log(`🔍 Testing getMeal (id: ${id.substring(0, 8)}...)...`);
  const result = await client.graphql({ query: getMeal, variables: { id } });
  const meal = (result as any).data.getMeal;
  console.log('✅ Meal:', meal.content?.substring(0, 50));
}


// ============================================================
// Mutation Tests
// ============================================================

async function testCreateWorkoutProgram(): Promise<string> {
  const client = generateClient({ authMode: 'userPool' });
  console.log('🆕 Testing createWorkoutProgram...');
  const result = await client.graphql({
    query: createWorkoutProgram,
    variables: {
      input: {
        title: `Test Workout Program ${Date.now()}`,
        status: WorkoutProgramStatus.ACTIVE,
        description: 'Test workout program created by frontest',
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        color: '#007bff',
      },
    },
  });
  const program = (result as any).data.createWorkoutProgram;
  console.log('✅ Created workout program:', program.id.substring(0, 8) + '...');
  return program.id;
}

async function testUpdateWorkoutProgram(programId: string): Promise<void> {
  const client = generateClient({ authMode: 'userPool' });
  console.log(`✏️ Testing updateWorkoutProgram (id: ${programId.substring(0, 8)}...)...`);
  await client.graphql({
    query: updateWorkoutProgram,
    variables: {
      input: {
        id: programId,
        title: 'Updated Test Workout Program',
        description: 'Updated by frontest',
        status: WorkoutProgramStatus.ON_HOLD,
        color: '#28a745',
      },
    },
  });
  console.log('✅ Updated workout program');
}

async function testDeleteWorkoutProgram(programId: string): Promise<void> {
  const client = generateClient({ authMode: 'userPool' });
  console.log(`🗑️ Testing deleteWorkoutProgram (id: ${programId.substring(0, 8)}...)...`);
  await client.graphql({
    query: deleteWorkoutProgram,
    variables: { input: { id: programId } },
  });
  console.log('✅ Deleted workout program');
}

async function testCreateExercise(programId: string): Promise<string> {
  const client = generateClient({ authMode: 'userPool' });
  console.log('🆕 Testing createExercise...');
  const result = await client.graphql({
    query: createExercise,
    variables: {
      input: {
        name: `Test Exercise ${Date.now()}`,
        description: 'Test exercise created by frontest - 3 sets of 10 reps',
        workoutProgramId: programId,
      },
    },
  });
  const exercise = (result as any).data.createExercise;
  console.log('✅ Created exercise:', exercise.id.substring(0, 8) + '...');
  return exercise.id;
}

async function testUpdateExercise(exerciseId: string, programId: string): Promise<void> {
  const client = generateClient({ authMode: 'userPool' });
  console.log(`✏️ Testing updateExercise (id: ${exerciseId.substring(0, 8)}...)...`);
  await client.graphql({
    query: updateExercise,
    variables: {
      input: {
        id: exerciseId,
        name: 'Updated Test Exercise',
        description: 'Updated by frontest - 4 sets of 12 reps',
        workoutProgramId: programId,
      },
    },
  });
  console.log('✅ Updated exercise');
}

async function testDeleteExercise(exerciseId: string): Promise<void> {
  const client = generateClient({ authMode: 'userPool' });
  console.log(`🗑️ Testing deleteExercise (id: ${exerciseId.substring(0, 8)}...)...`);
  await client.graphql({
    query: deleteExercise,
    variables: { input: { id: exerciseId } },
  });
  console.log('✅ Deleted exercise');
}

async function testCreateMeal(userName: string): Promise<string> {
  const client = generateClient({ authMode: 'apiKey' });
  console.log('🆕 Testing createMeal...');
  const result = await client.graphql({
    query: createMeal,
    variables: {
      input: {
        userName,
        content: `Test meal: Chicken breast, rice, and vegetables - ${Date.now()}`,
        timestamp: new Date().toISOString(),
      },
    },
  });
  const meal = (result as any).data.createMeal;
  console.log('✅ Created meal:', meal.id.substring(0, 8) + '...');
  return meal.id;
}

async function testUpdateMeal(mealId: string): Promise<void> {
  const client = generateClient({ authMode: 'apiKey' });
  console.log(`✏️ Testing updateMeal (id: ${mealId.substring(0, 8)}...)...`);
  await client.graphql({
    query: updateMeal,
    variables: {
      input: {
        id: mealId,
        content: 'Updated meal: Grilled salmon, quinoa, and steamed broccoli',
      },
    },
  });
  console.log('✅ Updated meal');
}

async function testDeleteMeal(mealId: string): Promise<void> {
  const client = generateClient({ authMode: 'apiKey' });
  console.log(`🗑️ Testing deleteMeal (id: ${mealId.substring(0, 8)}...)...`);
  await client.graphql({
    query: deleteMeal,
    variables: { input: { id: mealId } },
  });
  console.log('✅ Deleted meal');
}


// ============================================================
// REST API Tests
// ============================================================

async function testNutritionLogAPI(userName: string): Promise<void> {
  console.log('🍔 Testing REST API - POST /nutrition/log...');

  const restOperation = post({
    apiName: NUTRITION_API_NAME,
    path: '/nutrition/log',
    options: {
      body: {
        userName,
        content: `Test nutrition log via REST API - Pizza and salad - ${Date.now()}`,
      },
    },
  });

  const { body } = await restOperation.response;
  const response = await body.json();

  console.log('✅ REST API Response:', response);
  console.log('   Message:', (response as any).message);
}

async function testAdminListUsers(): Promise<void> {
  console.log('👥 Testing REST API - GET /admin/users...');

  const restOperation = get({
    apiName: ADMIN_API_NAME,
    path: '/admin/users',
  });

  const { body } = await restOperation.response;
  const response = await body.json();

  console.log(`✅ Found ${(response as any).count} users`);
}


// ============================================================
// User Provisioning
// ============================================================

async function signUp(config: any): Promise<{ username: string; password: string }> {
  const gen2Auth = (config as any)?.auth;
  const userPoolId = config.aws_user_pools_id ?? gen2Auth?.user_pool_id;
  const region = config.aws_cognito_region ?? gen2Auth?.aws_region;

  // Fitness tracker uses username-based auth with email as required attribute
  const username = generateTestUsername();
  const password = generateTestPassword();

  const cognitoClient = new CognitoIdentityProviderClient({ region });

  await cognitoClient.send(new AdminCreateUserCommand({
    UserPoolId: userPoolId,
    Username: username,
    TemporaryPassword: password,
    UserAttributes: [
      { Name: 'email', Value: generateTestEmail() },
      { Name: 'email_verified', Value: 'true' },
    ],
    MessageAction: 'SUPPRESS',
  }));

  await cognitoClient.send(new AdminSetUserPasswordCommand({
    UserPoolId: userPoolId,
    Username: username,
    Password: password,
    Permanent: true,
  }));

  await cognitoClient.send(new AdminAddUserToGroupCommand({
    UserPoolId: userPoolId,
    Username: username,
    GroupName: 'Admin',
  }));

  return { username, password };
}

function generateTestPassword(): string {
  return `Test${randomSuffix()}!Aa1`;
}

function generateTestEmail(): string {
  return `testuser-${randomSuffix()}@amazon.com`;
}

function generateTestUsername(): string {
  return `testuser-${randomSuffix()}`;
}

function randomSuffix(): string {
  return randomBytes(4).toString('hex');
}
