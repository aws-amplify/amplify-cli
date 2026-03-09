// test-utils.ts
/**
 * Shared test utilities for Fitness Tracker Gen1 and Gen2 test scripts
 */

import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/api';
import { getCurrentUser } from 'aws-amplify/auth';
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
import { TestRunner } from '../_test-common/test-apps-test-utils';
import amplifyconfig from './src/amplifyconfiguration.json';

// Configure Amplify in this module to ensure api singletons see the config
Amplify.configure(amplifyconfig);

// ============================================================
// Shared Test Functions Factory
// ============================================================

export function createTestFunctions() {
  function getAuthClient() {
    return generateClient({ authMode: 'userPool' });
  }

  // ============================================================
  // Query Test Functions
  // ============================================================

  async function testListWorkoutPrograms(): Promise<string | null> {
    console.log('\n📋 Testing listWorkoutPrograms...');
    const authClient = getAuthClient();
    const result = await authClient.graphql({ query: listWorkoutPrograms });
    const programs = (result as any).data.listWorkoutPrograms.items;
    console.log(`✅ Found ${programs.length} workout programs:`);
    programs.forEach((p: any) => console.log(`   - [${p.id}] ${p.title} (${p.status})${p.deadline ? ` - Due: ${p.deadline}` : ''}`));
    return programs.length > 0 ? programs[0].id : null;
  }

  async function testListExercises(): Promise<string | null> {
    console.log('\n💪 Testing listExercises...');
    const authClient = getAuthClient();
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

  async function testGetWorkoutProgram(id: string): Promise<void> {
    console.log(`\n🔍 Testing getWorkoutProgram (id: ${id})...`);
    const authClient = getAuthClient();
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

  async function testGetExercise(id: string): Promise<void> {
    console.log(`\n🔍 Testing getExercise (id: ${id})...`);
    const authClient = getAuthClient();
    const result = await authClient.graphql({
      query: getExercise,
      variables: { id },
    });
    console.log('✅ Exercise:', (result as any).data.getExercise);
  }

  async function testGetMeal(id: string): Promise<void> {
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

  async function testCreateWorkoutProgram(): Promise<string | null> {
    console.log('\n🆕 Testing createWorkoutProgram...');
    const authClient = getAuthClient();
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
    const authClient = getAuthClient();
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
    const authClient = getAuthClient();
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
    const authClient = getAuthClient();
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
    const authClient = getAuthClient();
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
    const authClient = getAuthClient();
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

  return {
    testListWorkoutPrograms,
    testListExercises,
    testListMeals,
    testGetWorkoutProgram,
    testGetExercise,
    testGetMeal,
    testCreateWorkoutProgram,
    testUpdateWorkoutProgram,
    testDeleteWorkoutProgram,
    testCreateExercise,
    testUpdateExercise,
    testDeleteExercise,
    testCreateMeal,
    testUpdateMeal,
    testDeleteMeal,
  };
}

// ============================================================
// Shared Test Orchestration Functions
// ============================================================

export function createTestOrchestrator(testFunctions: ReturnType<typeof createTestFunctions>, runner: TestRunner) {
  async function runQueryTests(): Promise<void> {
    console.log('\n' + '='.repeat(50));
    console.log('📖 PART 1: Authenticated GraphQL Queries');
    console.log('='.repeat(50));

    const programId = await runner.runTest('listWorkoutPrograms', testFunctions.testListWorkoutPrograms);
    const exerciseId = await runner.runTest('listExercises', testFunctions.testListExercises);
    const mealId = await runner.runTest('listMeals', testFunctions.testListMeals);

    if (programId) await runner.runTest('getWorkoutProgram', () => testFunctions.testGetWorkoutProgram(programId));
    if (exerciseId) await runner.runTest('getExercise', () => testFunctions.testGetExercise(exerciseId));
    if (mealId) await runner.runTest('getMeal', () => testFunctions.testGetMeal(mealId));
  }

  async function runMutationTests(): Promise<void> {
    console.log('\n' + '='.repeat(50));
    console.log('✏️ PART 2: Authenticated GraphQL Mutations');
    console.log('='.repeat(50));

    // Create workout program and exercise
    const programId = await runner.runTest('createWorkoutProgram', testFunctions.testCreateWorkoutProgram);
    const exerciseId = await runner.runTest('createExercise', () => testFunctions.testCreateExercise(programId || undefined));

    // Update workout program and exercise
    if (programId) await runner.runTest('updateWorkoutProgram', () => testFunctions.testUpdateWorkoutProgram(programId));
    if (exerciseId) await runner.runTest('updateExercise', () => testFunctions.testUpdateExercise(exerciseId, programId || undefined));

    // Create, update, and delete meal
    const mealId = await runner.runTest('createMeal', testFunctions.testCreateMeal);
    if (mealId) {
      await runner.runTest('updateMeal', () => testFunctions.testUpdateMeal(mealId));
      await runner.runTest('deleteMeal', () => testFunctions.testDeleteMeal(mealId));
    }

    // Cleanup: delete exercise and workout program
    if (exerciseId) await runner.runTest('deleteExercise', () => testFunctions.testDeleteExercise(exerciseId));
    if (programId) await runner.runTest('deleteWorkoutProgram', () => testFunctions.testDeleteWorkoutProgram(programId));
  }

  return {
    runQueryTests,
    runMutationTests,
  };
}
