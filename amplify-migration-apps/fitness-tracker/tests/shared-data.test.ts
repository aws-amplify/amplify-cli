/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Validates that the gen2-migration refactor correctly shares stateful resources
 * (AppSync/DynamoDB, REST APIs) between gen1 and gen2 configurations.
 *
 * Auth sharing is tested separately in shared-auth.test.ts.
 * Tests both directions: gen1→gen2 and gen2→gen1.
 */
import { generateClient } from 'aws-amplify/api';
import { post, get } from 'aws-amplify/api';
import { getCurrentUser, signIn, signOut } from 'aws-amplify/auth';
import { signUp, configureAmplify } from './signup';
import { createMeal, createWorkoutProgram, createExercise } from '../src/graphql/mutations';
import { getMeal, getWorkoutProgram, getExercise, listMeals } from '../src/graphql/queries';
import { WorkoutProgramStatus } from '../src/API';
import * as fs from 'fs';

const gen1Config = JSON.parse(fs.readFileSync('src/amplifyconfiguration.json', { encoding: 'utf-8' }));
const gen2Config = JSON.parse(fs.readFileSync('amplify_outputs.json', { encoding: 'utf-8' }));

describe('gen1 to gen2', () => {
  let username: string;
  let password: string;
  let userUsername: string;

  beforeAll(async () => {
    configureAmplify(gen1Config);
    const creds = await signUp(gen1Config);
    username = creds.username;
    password = creds.password;
    await signIn({ username, password });
    userUsername = (await getCurrentUser()).username;
  }, 60_000);

  afterAll(async () => {
    try { await signOut(); } catch { /* ignore */ }
  });

  it('data: meal created via gen1 can be read via gen2', async () => {
    configureAmplify(gen1Config);
    const content = `Chicken rice gen1→gen2 ${Date.now()}`;
    const timestamp = new Date().toISOString();
    const result = await generateClient({ authMode: 'apiKey' }).graphql({
      query: createMeal,
      variables: { input: { userName: userUsername, content, timestamp } },
    });
    const mealId = (result as any).data.createMeal.id;

    configureAmplify(gen2Config);
    const fetched = (await generateClient({ authMode: 'apiKey' }).graphql({
      query: getMeal,
      variables: { id: mealId },
    }) as any).data.getMeal;

    expect(fetched).not.toBeNull();
    expect(fetched.id).toBe(mealId);
    expect(fetched.content).toBe(content);
  }, 60_000);

  it('data: workout program created via gen1 can be read via gen2', async () => {
    configureAmplify(gen1Config);
    const title = `Push Pull gen1→gen2 ${Date.now()}`;
    const result = await generateClient({ authMode: 'userPool' }).graphql({
      query: createWorkoutProgram,
      variables: { input: { title, status: WorkoutProgramStatus.ACTIVE, description: 'Shared data test' } },
    });
    const programId = (result as any).data.createWorkoutProgram.id;

    configureAmplify(gen2Config);
    const fetched = (await generateClient({ authMode: 'userPool' }).graphql({
      query: getWorkoutProgram,
      variables: { id: programId },
    }) as any).data.getWorkoutProgram;

    expect(fetched).not.toBeNull();
    expect(fetched.id).toBe(programId);
    expect(fetched.title).toBe(title);
  }, 60_000);

  it('data: exercise created via gen1 can be read via gen2', async () => {
    configureAmplify(gen1Config);
    const programResult = await generateClient({ authMode: 'userPool' }).graphql({
      query: createWorkoutProgram,
      variables: { input: { title: `Exercise Parent g1→g2 ${Date.now()}`, status: WorkoutProgramStatus.ACTIVE } },
    });
    const programId = (programResult as any).data.createWorkoutProgram.id;

    const name = `Bench Press gen1→gen2 ${Date.now()}`;
    const exerciseResult = await generateClient({ authMode: 'userPool' }).graphql({
      query: createExercise,
      variables: { input: { name, description: '3x10', workoutProgramId: programId } },
    });
    const exerciseId = (exerciseResult as any).data.createExercise.id;

    configureAmplify(gen2Config);
    const fetched = (await generateClient({ authMode: 'userPool' }).graphql({
      query: getExercise,
      variables: { id: exerciseId },
    }) as any).data.getExercise;

    expect(fetched).not.toBeNull();
    expect(fetched.id).toBe(exerciseId);
    expect(fetched.name).toBe(name);
  }, 60_000);

});

describe('gen2 to gen1', () => {
  let username: string;
  let password: string;
  let userUsername: string;

  beforeAll(async () => {
    configureAmplify(gen2Config);
    const creds = await signUp(gen2Config);
    username = creds.username;
    password = creds.password;
    await signIn({ username, password });
    userUsername = (await getCurrentUser()).username;
  }, 60_000);

  afterAll(async () => {
    try { await signOut(); } catch { /* ignore */ }
  });

  it('data: meal created via gen2 can be read via gen1', async () => {
    configureAmplify(gen2Config);
    const content = `Salmon quinoa gen2→gen1 ${Date.now()}`;
    const timestamp = new Date().toISOString();
    const result = await generateClient({ authMode: 'apiKey' }).graphql({
      query: createMeal,
      variables: { input: { userName: userUsername, content, timestamp } },
    });
    const mealId = (result as any).data.createMeal.id;

    configureAmplify(gen1Config);
    const fetched = (await generateClient({ authMode: 'apiKey' }).graphql({
      query: getMeal,
      variables: { id: mealId },
    }) as any).data.getMeal;

    expect(fetched).not.toBeNull();
    expect(fetched.id).toBe(mealId);
    expect(fetched.content).toBe(content);
  }, 60_000);

  it('data: workout program created via gen2 can be read via gen1', async () => {
    configureAmplify(gen2Config);
    const title = `Push Pull gen2→gen1 ${Date.now()}`;
    const result = await generateClient({ authMode: 'userPool' }).graphql({
      query: createWorkoutProgram,
      variables: { input: { title, status: WorkoutProgramStatus.ACTIVE, description: 'Shared data test' } },
    });
    const programId = (result as any).data.createWorkoutProgram.id;

    configureAmplify(gen1Config);
    const fetched = (await generateClient({ authMode: 'userPool' }).graphql({
      query: getWorkoutProgram,
      variables: { id: programId },
    }) as any).data.getWorkoutProgram;

    expect(fetched).not.toBeNull();
    expect(fetched.id).toBe(programId);
    expect(fetched.title).toBe(title);
  }, 60_000);

  it('data: exercise created via gen2 can be read via gen1', async () => {
    configureAmplify(gen2Config);
    const programResult = await generateClient({ authMode: 'userPool' }).graphql({
      query: createWorkoutProgram,
      variables: { input: { title: `Exercise Parent g2→g1 ${Date.now()}`, status: WorkoutProgramStatus.ACTIVE } },
    });
    const programId = (programResult as any).data.createWorkoutProgram.id;

    const name = `Deadlift gen2→gen1 ${Date.now()}`;
    const exerciseResult = await generateClient({ authMode: 'userPool' }).graphql({
      query: createExercise,
      variables: { input: { name, description: '4x8', workoutProgramId: programId } },
    });
    const exerciseId = (exerciseResult as any).data.createExercise.id;

    configureAmplify(gen1Config);
    const fetched = (await generateClient({ authMode: 'userPool' }).graphql({
      query: getExercise,
      variables: { id: exerciseId },
    }) as any).data.getExercise;

    expect(fetched).not.toBeNull();
    expect(fetched.id).toBe(exerciseId);
    expect(fetched.name).toBe(name);
  }, 60_000);

});
