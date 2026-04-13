/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Validates that the gen2-migration refactor correctly shares stateful resources
 * (Cognito user pool, AppSync/DynamoDB, REST APIs) between gen1 and gen2 configurations.
 *
 * Tests both directions: gen1→gen2 and gen2→gen1.
 */
import { generateClient } from 'aws-amplify/api';
import { post, get } from 'aws-amplify/api';
import { getCurrentUser, signIn, signOut } from 'aws-amplify/auth';
import { signUp, configureAmplify } from './signup';
import { createMeal, createWorkoutProgram, createExercise } from '../src/graphql/mutations';
import { getMeal, getWorkoutProgram, getExercise, listMeals } from '../src/graphql/queries';
import { NUTRITION_API_NAME, ADMIN_API_NAME } from '../src/api-config';
import { WorkoutProgramStatus } from '../src/API';
import * as fs from 'fs';

const gen1Config = JSON.parse(fs.readFileSync('src/amplifyconfiguration.json', { encoding: 'utf-8' }));
const gen2Config = JSON.parse(fs.readFileSync('amplify_outputs.json', { encoding: 'utf-8' }));

describe('gen1 to gen2', () => {
  let username: string;
  let password: string;

  beforeAll(async () => {
    configureAmplify(gen1Config);
    const creds = await signUp(gen1Config);
    username = creds.username;
    password = creds.password;
  }, 60_000);

  afterAll(async () => {
    try { await signOut(); } catch { /* ignore */ }
  });

  it('auth: user created via gen1 can sign in via gen2', async () => {
    configureAmplify(gen1Config);
    await signIn({ username, password });
    const gen1User = await getCurrentUser();
    await signOut();

    configureAmplify(gen2Config);
    await signIn({ username, password });
    const gen2User = await getCurrentUser();
    await signOut();

    expect(gen2User.userId).toBe(gen1User.userId);
  }, 60_000);

  it('data: meal created via gen1 can be read via gen2', async () => {
    configureAmplify(gen1Config);
    await signIn({ username, password });

    const currentUser = await getCurrentUser();
    const content = `Chicken rice gen1→gen2 ${Date.now()}`;
    const timestamp = new Date().toISOString();
    const result = await generateClient({ authMode: 'apiKey' }).graphql({
      query: createMeal,
      variables: { input: { userName: currentUser.username, content, timestamp } },
    });
    const mealId = (result as any).data.createMeal.id;
    await signOut();

    configureAmplify(gen2Config);
    await signIn({ username, password });

    const fetched = (await generateClient({ authMode: 'apiKey' }).graphql({
      query: getMeal,
      variables: { id: mealId },
    }) as any).data.getMeal;

    expect(fetched).not.toBeNull();
    expect(fetched.id).toBe(mealId);
    expect(fetched.content).toBe(content);
    await signOut();
  }, 60_000);

  it('data: workout program created via gen1 can be read via gen2', async () => {
    configureAmplify(gen1Config);
    await signIn({ username, password });

    const title = `Push Pull gen1→gen2 ${Date.now()}`;
    const result = await generateClient({ authMode: 'userPool' }).graphql({
      query: createWorkoutProgram,
      variables: { input: { title, status: WorkoutProgramStatus.ACTIVE, description: 'Shared data test' } },
    });
    const programId = (result as any).data.createWorkoutProgram.id;
    await signOut();

    configureAmplify(gen2Config);
    await signIn({ username, password });

    const fetched = (await generateClient({ authMode: 'userPool' }).graphql({
      query: getWorkoutProgram,
      variables: { id: programId },
    }) as any).data.getWorkoutProgram;

    expect(fetched).not.toBeNull();
    expect(fetched.id).toBe(programId);
    expect(fetched.title).toBe(title);
    await signOut();
  }, 60_000);

  it('data: exercise created via gen1 can be read via gen2', async () => {
    configureAmplify(gen1Config);
    await signIn({ username, password });

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
    await signOut();

    configureAmplify(gen2Config);
    await signIn({ username, password });

    const fetched = (await generateClient({ authMode: 'userPool' }).graphql({
      query: getExercise,
      variables: { id: exerciseId },
    }) as any).data.getExercise;

    expect(fetched).not.toBeNull();
    expect(fetched.id).toBe(exerciseId);
    expect(fetched.name).toBe(name);
    await signOut();
  }, 60_000);

  it('rest: meal logged via nutrition API on gen1 is visible via gen2', async () => {
    configureAmplify(gen1Config);
    await signIn({ username, password });

    const currentUser = await getCurrentUser();
    const content = `Nutrition g1→g2 ${Date.now()}`;
    await (await post({
      apiName: NUTRITION_API_NAME,
      path: '/nutrition/log',
      options: { body: { userName: currentUser.username, content } },
    }).response).body.json();
    await signOut();

    // Read back via gen2 GraphQL to confirm the DynamoDB record exists
    configureAmplify(gen2Config);
    await signIn({ username, password });

    const listResult = await generateClient({ authMode: 'apiKey' }).graphql({
      query: listMeals,
      variables: { filter: { content: { eq: content } } },
    });
    const items = (listResult as any).data.listMeals.items;
    expect(items.length).toBeGreaterThanOrEqual(1);
    expect(items[0].content).toBe(content);
    await signOut();
  }, 60_000);

  it('rest: admin API returns same user count via gen1 and gen2', async () => {
    configureAmplify(gen1Config);
    await signIn({ username, password });

    const gen1Response = await (await get({
      apiName: ADMIN_API_NAME,
      path: '/admin/users',
    }).response).body.json() as any;
    const gen1Count = gen1Response.count;
    await signOut();

    configureAmplify(gen2Config);
    await signIn({ username, password });

    const gen2Response = await (await get({
      apiName: ADMIN_API_NAME,
      path: '/admin/users',
    }).response).body.json() as any;

    expect(gen2Response.count).toBe(gen1Count);
    await signOut();
  }, 60_000);
});

describe('gen2 to gen1', () => {
  let username: string;
  let password: string;

  beforeAll(async () => {
    configureAmplify(gen2Config);
    const creds = await signUp(gen2Config);
    username = creds.username;
    password = creds.password;
  }, 60_000);

  afterAll(async () => {
    try { await signOut(); } catch { /* ignore */ }
  });

  it('auth: user created via gen2 can sign in via gen1', async () => {
    configureAmplify(gen2Config);
    await signIn({ username, password });
    const gen2User = await getCurrentUser();
    await signOut();

    configureAmplify(gen1Config);
    await signIn({ username, password });
    const gen1User = await getCurrentUser();
    await signOut();

    expect(gen1User.userId).toBe(gen2User.userId);
  }, 60_000);

  it('data: meal created via gen2 can be read via gen1', async () => {
    configureAmplify(gen2Config);
    await signIn({ username, password });

    const currentUser = await getCurrentUser();
    const content = `Salmon quinoa gen2→gen1 ${Date.now()}`;
    const timestamp = new Date().toISOString();
    const result = await generateClient({ authMode: 'apiKey' }).graphql({
      query: createMeal,
      variables: { input: { userName: currentUser.username, content, timestamp } },
    });
    const mealId = (result as any).data.createMeal.id;
    await signOut();

    configureAmplify(gen1Config);
    await signIn({ username, password });

    const fetched = (await generateClient({ authMode: 'apiKey' }).graphql({
      query: getMeal,
      variables: { id: mealId },
    }) as any).data.getMeal;

    expect(fetched).not.toBeNull();
    expect(fetched.id).toBe(mealId);
    expect(fetched.content).toBe(content);
    await signOut();
  }, 60_000);

  it('data: workout program created via gen2 can be read via gen1', async () => {
    configureAmplify(gen2Config);
    await signIn({ username, password });

    const title = `Push Pull gen2→gen1 ${Date.now()}`;
    const result = await generateClient({ authMode: 'userPool' }).graphql({
      query: createWorkoutProgram,
      variables: { input: { title, status: WorkoutProgramStatus.ACTIVE, description: 'Shared data test' } },
    });
    const programId = (result as any).data.createWorkoutProgram.id;
    await signOut();

    configureAmplify(gen1Config);
    await signIn({ username, password });

    const fetched = (await generateClient({ authMode: 'userPool' }).graphql({
      query: getWorkoutProgram,
      variables: { id: programId },
    }) as any).data.getWorkoutProgram;

    expect(fetched).not.toBeNull();
    expect(fetched.id).toBe(programId);
    expect(fetched.title).toBe(title);
    await signOut();
  }, 60_000);

  it('data: exercise created via gen2 can be read via gen1', async () => {
    configureAmplify(gen2Config);
    await signIn({ username, password });

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
    await signOut();

    configureAmplify(gen1Config);
    await signIn({ username, password });

    const fetched = (await generateClient({ authMode: 'userPool' }).graphql({
      query: getExercise,
      variables: { id: exerciseId },
    }) as any).data.getExercise;

    expect(fetched).not.toBeNull();
    expect(fetched.id).toBe(exerciseId);
    expect(fetched.name).toBe(name);
    await signOut();
  }, 60_000);

  it('rest: meal logged via nutrition API on gen2 is visible via gen1', async () => {
    configureAmplify(gen2Config);
    await signIn({ username, password });

    const currentUser = await getCurrentUser();
    const content = `Nutrition g2→g1 ${Date.now()}`;
    await (await post({
      apiName: NUTRITION_API_NAME,
      path: '/nutrition/log',
      options: { body: { userName: currentUser.username, content } },
    }).response).body.json();
    await signOut();

    // Read back via gen1 GraphQL to confirm the DynamoDB record exists
    configureAmplify(gen1Config);
    await signIn({ username, password });

    const listResult = await generateClient({ authMode: 'apiKey' }).graphql({
      query: listMeals,
      variables: { filter: { content: { eq: content } } },
    });
    const items = (listResult as any).data.listMeals.items;
    expect(items.length).toBeGreaterThanOrEqual(1);
    expect(items[0].content).toBe(content);
    await signOut();
  }, 60_000);

  it('rest: admin API returns same user count via gen2 and gen1', async () => {
    configureAmplify(gen2Config);
    await signIn({ username, password });

    const gen2Response = await (await get({
      apiName: ADMIN_API_NAME,
      path: '/admin/users',
    }).response).body.json() as any;
    const gen2Count = gen2Response.count;
    await signOut();

    configureAmplify(gen1Config);
    await signIn({ username, password });

    const gen1Response = await (await get({
      apiName: ADMIN_API_NAME,
      path: '/admin/users',
    }).response).body.json() as any;

    expect(gen1Response.count).toBe(gen2Count);
    await signOut();
  }, 60_000);
});
