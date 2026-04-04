/* eslint-disable @typescript-eslint/no-explicit-any */
import { generateClient } from 'aws-amplify/api';
import { getCurrentUser, signIn, signOut } from 'aws-amplify/auth';
import { post, get } from 'aws-amplify/api';
import { NUTRITION_API_NAME, ADMIN_API_NAME, configureAmplify } from '../src/api-config';
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
} from '../src/graphql/queries';
import {
  createWorkoutProgram, updateWorkoutProgram, deleteWorkoutProgram,
  createExercise, updateExercise, deleteExercise,
  createMeal, updateMeal, deleteMeal,
} from '../src/graphql/mutations';
import { WorkoutProgramStatus } from '../src/API';

// Polyfill crypto for Node.js environment (required for Amplify Auth)
import { webcrypto } from 'crypto';
if (typeof globalThis.crypto === 'undefined') {
  (globalThis as any).crypto = webcrypto;
}

const CONFIG_PATH =
  '/var/folders/h1/jwrpxx4x66s6kz1qvl16p3h00000gq/T/amplify-gen2-migration-e2e-system/output-apps/fitnesstra2604032303/src/amplifyconfiguration.json';

const config = JSON.parse(fs.readFileSync(CONFIG_PATH, { encoding: 'utf-8' }));
configureAmplify(config);

let username: string;
let password: string;

async function signUp(cfg: any): Promise<{ username: string; password: string }> {
  const gen2Auth = (cfg as any)?.auth;
  const userPoolId = cfg.aws_user_pools_id ?? gen2Auth?.user_pool_id;
  const region = cfg.aws_cognito_region ?? gen2Auth?.aws_region;

  const uname = generateTestUsername();
  const pwd = generateTestPassword();

  const cognitoClient = new CognitoIdentityProviderClient({ region });

  await cognitoClient.send(new AdminCreateUserCommand({
    UserPoolId: userPoolId,
    Username: uname,
    TemporaryPassword: pwd,
    UserAttributes: [
      { Name: 'email', Value: generateTestEmail() },
      { Name: 'email_verified', Value: 'true' },
    ],
    MessageAction: 'SUPPRESS',
  }));

  await cognitoClient.send(new AdminSetUserPasswordCommand({
    UserPoolId: userPoolId,
    Username: uname,
    Password: pwd,
    Permanent: true,
  }));

  await cognitoClient.send(new AdminAddUserToGroupCommand({
    UserPoolId: userPoolId,
    Username: uname,
    GroupName: 'Admin',
  }));

  return { username: uname, password: pwd };
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

// ============================================================
// Global setup
// ============================================================

beforeAll(async () => {
  const creds = await signUp(config);
  username = creds.username;
  password = creds.password;
  await signIn({ username, password });
}, 60_000);

afterAll(async () => {
  await signOut();
});

describe('WorkoutProgram', () => {
  const client = () => generateClient({ authMode: 'userPool' });

  it('creates a workout program with correct fields', async () => {
    const deadline = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const input = {
      title: `Test Program ${Date.now()}`,
      status: WorkoutProgramStatus.ACTIVE,
      description: 'Created by jest',
      deadline,
      color: '#007bff',
    };

    const result = await client().graphql({ query: createWorkoutProgram, variables: { input } });
    const program = (result as any).data.createWorkoutProgram;

    expect(typeof program.id).toBe('string');
    expect(program.id.length).toBeGreaterThan(0);
    expect(program.title).toBe(input.title);
    expect(program.status).toBe(WorkoutProgramStatus.ACTIVE);
    expect(program.description).toBe('Created by jest');
    expect(program.deadline).toBe(deadline);
    expect(program.color).toBe('#007bff');
    expect(program.createdAt).toBeDefined();
    expect(program.updatedAt).toBeDefined();
    expect(program.owner).toBeDefined();
  });

  it('reads a workout program by id', async () => {
    const createResult = await client().graphql({
      query: createWorkoutProgram,
      variables: { input: { title: `Read Test ${Date.now()}`, status: WorkoutProgramStatus.COMPLETED, description: 'For read test' } },
    });
    const created = (createResult as any).data.createWorkoutProgram;

    const getResult = await client().graphql({ query: getWorkoutProgram, variables: { id: created.id } });
    const fetched = (getResult as any).data.getWorkoutProgram;

    expect(fetched).not.toBeNull();
    expect(fetched.id).toBe(created.id);
    expect(fetched.title).toBe(created.title);
    expect(fetched.status).toBe(WorkoutProgramStatus.COMPLETED);
    expect(fetched.description).toBe('For read test');
  });

  it('updates a workout program and persists changes', async () => {
    const createResult = await client().graphql({
      query: createWorkoutProgram,
      variables: { input: { title: `Update Test ${Date.now()}`, status: WorkoutProgramStatus.ACTIVE, color: '#000000' } },
    });
    const created = (createResult as any).data.createWorkoutProgram;

    await client().graphql({
      query: updateWorkoutProgram,
      variables: { input: { id: created.id, title: 'Updated Title', status: WorkoutProgramStatus.ON_HOLD, color: '#28a745', description: 'Now updated' } },
    });

    const getResult = await client().graphql({ query: getWorkoutProgram, variables: { id: created.id } });
    const fetched = (getResult as any).data.getWorkoutProgram;

    expect(fetched.title).toBe('Updated Title');
    expect(fetched.status).toBe(WorkoutProgramStatus.ON_HOLD);
    expect(fetched.color).toBe('#28a745');
    expect(fetched.description).toBe('Now updated');
  });

  it('deletes a workout program', async () => {
    const createResult = await client().graphql({
      query: createWorkoutProgram,
      variables: { input: { title: `Delete Test ${Date.now()}`, status: WorkoutProgramStatus.ARCHIVED } },
    });
    const created = (createResult as any).data.createWorkoutProgram;

    await client().graphql({ query: deleteWorkoutProgram, variables: { input: { id: created.id } } });

    const getResult = await client().graphql({ query: getWorkoutProgram, variables: { id: created.id } });
    expect((getResult as any).data.getWorkoutProgram).toBeNull();
  });

  it('lists workout programs including a newly created one', async () => {
    const title = `List Test ${Date.now()}`;
    const createResult = await client().graphql({
      query: createWorkoutProgram,
      variables: { input: { title, status: WorkoutProgramStatus.ACTIVE } },
    });
    const created = (createResult as any).data.createWorkoutProgram;

    const listResult = await client().graphql({ query: listWorkoutPrograms });
    const items = (listResult as any).data.listWorkoutPrograms.items;

    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBeGreaterThanOrEqual(1);
    const found = items.find((p: any) => p.id === created.id);
    expect(found).toBeDefined();
    expect(found.title).toBe(title);
  });
});


describe('Exercise', () => {
  const client = () => generateClient({ authMode: 'userPool' });

  async function createParentProgram(): Promise<string> {
    const result = await client().graphql({
      query: createWorkoutProgram,
      variables: { input: { title: `Exercise Parent ${Date.now()}`, status: WorkoutProgramStatus.ACTIVE } },
    });
    return (result as any).data.createWorkoutProgram.id;
  }

  it('creates an exercise linked to a program', async () => {
    const programId = await createParentProgram();
    const input = { name: `Bench Press ${Date.now()}`, description: '3 sets of 10 reps', workoutProgramId: programId };

    const result = await client().graphql({ query: createExercise, variables: { input } });
    const exercise = (result as any).data.createExercise;

    expect(typeof exercise.id).toBe('string');
    expect(exercise.id.length).toBeGreaterThan(0);
    expect(exercise.name).toBe(input.name);
    expect(exercise.description).toBe('3 sets of 10 reps');
    expect(exercise.workoutProgramId).toBe(programId);
    expect(exercise.createdAt).toBeDefined();
    expect(exercise.owner).toBeDefined();
  });

  it('reads an exercise by id', async () => {
    const programId = await createParentProgram();
    const createResult = await client().graphql({
      query: createExercise,
      variables: { input: { name: `Read Exercise ${Date.now()}`, description: 'For read test', workoutProgramId: programId } },
    });
    const created = (createResult as any).data.createExercise;

    const getResult = await client().graphql({ query: getExercise, variables: { id: created.id } });
    const fetched = (getResult as any).data.getExercise;

    expect(fetched).not.toBeNull();
    expect(fetched.id).toBe(created.id);
    expect(fetched.name).toBe(created.name);
    expect(fetched.description).toBe('For read test');
    expect(fetched.workoutProgramId).toBe(programId);
  });

  it('updates an exercise and persists changes', async () => {
    const programId = await createParentProgram();
    const createResult = await client().graphql({
      query: createExercise,
      variables: { input: { name: `Update Exercise ${Date.now()}`, description: 'Original', workoutProgramId: programId } },
    });
    const created = (createResult as any).data.createExercise;

    await client().graphql({
      query: updateExercise,
      variables: { input: { id: created.id, name: 'Updated Deadlift', description: '4 sets of 12 reps', workoutProgramId: programId } },
    });

    const getResult = await client().graphql({ query: getExercise, variables: { id: created.id } });
    const fetched = (getResult as any).data.getExercise;

    expect(fetched.name).toBe('Updated Deadlift');
    expect(fetched.description).toBe('4 sets of 12 reps');
  });

  it('deletes an exercise', async () => {
    const programId = await createParentProgram();
    const createResult = await client().graphql({
      query: createExercise,
      variables: { input: { name: `Delete Exercise ${Date.now()}`, workoutProgramId: programId } },
    });
    const created = (createResult as any).data.createExercise;

    await client().graphql({ query: deleteExercise, variables: { input: { id: created.id } } });

    const getResult = await client().graphql({ query: getExercise, variables: { id: created.id } });
    expect((getResult as any).data.getExercise).toBeNull();
  });

  it('lists exercises including a newly created one', async () => {
    const programId = await createParentProgram();
    const name = `List Exercise ${Date.now()}`;
    const createResult = await client().graphql({
      query: createExercise,
      variables: { input: { name, workoutProgramId: programId } },
    });
    const created = (createResult as any).data.createExercise;

    const listResult = await client().graphql({ query: listExercises });
    const items = (listResult as any).data.listExercises.items;

    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBeGreaterThanOrEqual(1);
    const found = items.find((e: any) => e.id === created.id);
    expect(found).toBeDefined();
    expect(found.name).toBe(name);
  });
});

describe('Meal', () => {
  const client = () => generateClient({ authMode: 'apiKey' });

  it('creates a meal with correct fields', async () => {
    const currentUser = await getCurrentUser();
    const content = `Chicken and rice - ${Date.now()}`;
    const timestamp = new Date().toISOString();

    const result = await client().graphql({
      query: createMeal,
      variables: { input: { userName: currentUser.username, content, timestamp } },
    });
    const meal = (result as any).data.createMeal;

    expect(typeof meal.id).toBe('string');
    expect(meal.id.length).toBeGreaterThan(0);
    expect(meal.userName).toBe(currentUser.username);
    expect(meal.content).toBe(content);
    expect(meal.timestamp).toBe(timestamp);
    expect(meal.createdAt).toBeDefined();
    expect(meal.updatedAt).toBeDefined();
  });

  it('reads a meal by id', async () => {
    const currentUser = await getCurrentUser();
    const content = `Read meal test - ${Date.now()}`;
    const timestamp = new Date().toISOString();

    const createResult = await client().graphql({
      query: createMeal,
      variables: { input: { userName: currentUser.username, content, timestamp } },
    });
    const created = (createResult as any).data.createMeal;

    const getResult = await client().graphql({ query: getMeal, variables: { id: created.id } });
    const fetched = (getResult as any).data.getMeal;

    expect(fetched).not.toBeNull();
    expect(fetched.id).toBe(created.id);
    expect(fetched.userName).toBe(currentUser.username);
    expect(fetched.content).toBe(content);
    expect(fetched.timestamp).toBe(timestamp);
  });

  it('updates a meal and persists changes', async () => {
    const currentUser = await getCurrentUser();
    const createResult = await client().graphql({
      query: createMeal,
      variables: { input: { userName: currentUser.username, content: 'Original meal', timestamp: new Date().toISOString() } },
    });
    const created = (createResult as any).data.createMeal;

    const updatedContent = 'Grilled salmon and quinoa';
    await client().graphql({ query: updateMeal, variables: { input: { id: created.id, content: updatedContent } } });

    const getResult = await client().graphql({ query: getMeal, variables: { id: created.id } });
    const fetched = (getResult as any).data.getMeal;

    expect(fetched.content).toBe(updatedContent);
    expect(fetched.userName).toBe(currentUser.username);
    expect(fetched.timestamp).toBe(created.timestamp);
  });

  it('deletes a meal', async () => {
    const currentUser = await getCurrentUser();
    const createResult = await client().graphql({
      query: createMeal,
      variables: { input: { userName: currentUser.username, content: 'Delete me', timestamp: new Date().toISOString() } },
    });
    const created = (createResult as any).data.createMeal;

    await client().graphql({ query: deleteMeal, variables: { input: { id: created.id } } });

    const getResult = await client().graphql({ query: getMeal, variables: { id: created.id } });
    expect((getResult as any).data.getMeal).toBeNull();
  });

  it('lists meals including a newly created one', async () => {
    const currentUser = await getCurrentUser();
    const content = `List meal test - ${Date.now()}`;
    const createResult = await client().graphql({
      query: createMeal,
      variables: { input: { userName: currentUser.username, content, timestamp: new Date().toISOString() } },
    });
    const created = (createResult as any).data.createMeal;

    const listResult = await client().graphql({ query: listMeals });
    const items = (listResult as any).data.listMeals.items;

    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBeGreaterThanOrEqual(1);
    const found = items.find((m: any) => m.id === created.id);
    expect(found).toBeDefined();
    expect(found.content).toBe(content);
  });
});

describe('Nutrition REST API', () => {
  it('POST /nutrition/log returns a success message', async () => {
    const currentUser = await getCurrentUser();

    const restOperation = post({
      apiName: NUTRITION_API_NAME,
      path: '/nutrition/log',
      options: {
        body: { userName: currentUser.username, content: `Jest nutrition log - ${Date.now()}` },
      },
    });

    const { body } = await restOperation.response;
    const response = await body.json() as any;

    expect(response).toBeDefined();
    expect(typeof response.message).toBe('string');
    expect(response.message.length).toBeGreaterThan(0);
  });
});

describe('Admin REST API', () => {
  it('GET /admin/users returns a user list with count', async () => {
    const restOperation = get({
      apiName: ADMIN_API_NAME,
      path: '/admin/users',
    });

    const { body } = await restOperation.response;
    const response = await body.json() as any;

    expect(response).toBeDefined();
    expect(typeof response.count).toBe('number');
    expect(response.count).toBeGreaterThanOrEqual(1);
  });
});
