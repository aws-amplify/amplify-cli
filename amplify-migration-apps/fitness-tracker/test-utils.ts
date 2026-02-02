// test-utils.ts
import { generateClient } from 'aws-amplify/api';
import { signIn, signOut, getCurrentUser } from 'aws-amplify/auth';
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

export interface TestFailure {
  name: string;
  error: string;
}

export interface TestUser {
  username: string;
  password: string;
}

export function createTestRunner() {
  const failures: TestFailure[] = [];

  async function runTest<T>(name: string, testFn: () => Promise<T>): Promise<T | null> {
    try {
      const result = await testFn();
      return result;
    } catch (error: any) {
      // Handle different error formats (GraphQL errors, standard errors, objects)
      let errorMessage: string;
      if (error.errors?.[0]?.message) {
        // GraphQL error format
        errorMessage = error.errors[0].message;
      } else if (error.message) {
        // Standard Error
        errorMessage = error.message;
      } else if (typeof error === 'object') {
        // Generic object - stringify it
        errorMessage = JSON.stringify(error, null, 2);
      } else {
        errorMessage = String(error);
      }

      failures.push({ name, error: errorMessage });
      return null;
    }
  }

  function printSummary(): void {
    console.log('\n' + '='.repeat(50));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(50));

    if (failures.length === 0) {
      console.log('\n✅ All tests passed!');
    } else {
      console.log(`\n❌ ${failures.length} test(s) failed:\n`);
      failures.forEach((f) => {
        console.log(`  • ${f.name}`);
        console.log(`    Error: ${f.error}\n`);
      });
      process.exit(1);
    }
  }

  return { failures, runTest, printSummary };
}

// ============================================================
// Authentication Helper Functions
// ============================================================
export async function authenticateUser(testUser: TestUser): Promise<boolean> {
  console.log('\n🔐 Authenticating user...');
  try {
    await signIn({
      username: testUser.username,
      password: testUser.password,
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

export async function signOutUser(): Promise<void> {
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
export async function testListWorkoutPrograms(): Promise<string | null> {
  console.log('\n📋 Testing listWorkoutPrograms...');
  const authClient = generateClient({ authMode: 'userPool' });
  const result = await authClient.graphql({ query: listWorkoutPrograms });
  const programs = (result as any).data.listWorkoutPrograms.items;
  console.log(`✅ Found ${programs.length} workout programs:`);
  programs.forEach((p: any) => console.log(`   - [${p.id}] ${p.title} (${p.status})${p.deadline ? ` - Due: ${p.deadline}` : ''}`));
  return programs.length > 0 ? programs[0].id : null;
}

export async function testListExercises(): Promise<string | null> {
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

export async function testListMeals(): Promise<string | null> {
  console.log('\n🍽️  Testing listMeals...');
  const apiKeyClient = generateClient({ authMode: 'apiKey' });
  const result = await apiKeyClient.graphql({ query: listMeals });
  const meals = (result as any).data.listMeals.items;
  console.log(`✅ Found ${meals.length} meals:`);
  meals.forEach((m: any) => console.log(`   - [${m.id}] ${m.userName}: ${m.content} (${m.timestamp})`));
  return meals.length > 0 ? meals[0].id : null;
}

export async function testGetWorkoutProgram(id: string): Promise<void> {
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

export async function testGetExercise(id: string): Promise<void> {
  console.log(`\n🔍 Testing getExercise (id: ${id})...`);
  const authClient = generateClient({ authMode: 'userPool' });
  const result = await authClient.graphql({
    query: getExercise,
    variables: { id },
  });
  console.log('✅ Exercise:', (result as any).data.getExercise);
}

export async function testGetMeal(id: string): Promise<void> {
  console.log(`\n🔍 Testing getMeal (id: ${id})...`);
  const apiKeyClient = generateClient({ authMode: 'apiKey' });
  const result = await apiKeyClient.graphql({
    query: getMeal,
    variables: { id },
  });
  console.log('✅ Meal:', (result as any).data.getMeal);
}

// ============================================================
// Mutation Test Functions - Workout Programs
// ============================================================
export async function testCreateWorkoutProgram(): Promise<string | null> {
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

export async function testUpdateWorkoutProgram(programId: string): Promise<void> {
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

export async function testDeleteWorkoutProgram(programId: string): Promise<void> {
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
export async function testCreateExercise(programId?: string): Promise<string | null> {
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

export async function testUpdateExercise(exerciseId: string, newProgramId?: string): Promise<void> {
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

export async function testDeleteExercise(exerciseId: string): Promise<void> {
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
export async function testCreateMeal(): Promise<string | null> {
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

export async function testUpdateMeal(mealId: string): Promise<void> {
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

export async function testDeleteMeal(mealId: string): Promise<void> {
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
// Main Test Runners
// ============================================================
export async function runQueryTests(runTest: <T>(name: string, testFn: () => Promise<T>) => Promise<T | null>): Promise<void> {
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

export async function runMutationTests(runTest: <T>(name: string, testFn: () => Promise<T>) => Promise<T | null>): Promise<void> {
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
