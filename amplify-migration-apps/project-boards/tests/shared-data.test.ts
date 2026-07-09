/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Validates that the gen2-migration refactor correctly shares stateful resources
 * (AppSync/DynamoDB, S3 bucket, Lambda) between gen1 and gen2 configurations.
 *
 * Auth sharing is tested separately in shared-auth.test.ts.
 * Tests both directions: gen1→gen2 and gen2→gen1.
 */
import { generateClient } from 'aws-amplify/api';
import { signIn, signOut } from 'aws-amplify/auth';
import { uploadData, downloadData } from 'aws-amplify/storage';
import { signUp, configureAmplify } from './signup';
import { createProject, createTodo } from '../src/graphql/mutations';
import { getProject, getTodo } from '../src/graphql/queries';
import { ProjectStatus } from '../src/API';
import * as fs from 'fs';

const gen1Config = JSON.parse(fs.readFileSync('src/amplifyconfiguration.json', { encoding: 'utf-8' }));
const gen2Config = JSON.parse(fs.readFileSync('amplify_outputs.json', { encoding: 'utf-8' }));

const getRandomQuote = /* GraphQL */ `
  query GetRandomQuote {
    getRandomQuote {
      message
      quote
      author
      timestamp
      totalQuotes
    }
  }
`;

describe('gen1 to gen2', () => {
  let username: string;
  let password: string;

  beforeAll(async () => {
    configureAmplify(gen1Config);
    const creds = await signUp(gen1Config);
    username = creds.username;
    password = creds.password;
    await signIn({ username, password });
  }, 60_000);

  afterAll(async () => {
    try {
      await signOut();
    } catch {
      /* ignore */
    }
  });

  it('data: project created via gen1 can be read via gen2', async () => {
    configureAmplify(gen1Config);
    const title = `Board gen1→gen2 ${Date.now()}`;
    const result = await generateClient({ authMode: 'userPool' }).graphql({
      query: createProject,
      variables: { input: { title, status: ProjectStatus.ACTIVE, description: 'Shared data test' } },
    });
    const projectId = (result as any).data.createProject.id;

    configureAmplify(gen2Config);
    const fetched = (
      (await generateClient({ authMode: 'userPool' }).graphql({
        query: getProject,
        variables: { id: projectId },
      })) as any
    ).data.getProject;

    expect(fetched).not.toBeNull();
    expect(fetched.id).toBe(projectId);
    expect(fetched.title).toBe(title);
  }, 60_000);

  it('data: todo created via gen1 can be read via gen2', async () => {
    configureAmplify(gen1Config);
    const projectResult = await generateClient({ authMode: 'userPool' }).graphql({
      query: createProject,
      variables: { input: { title: `Todo Parent g1→g2 ${Date.now()}`, status: ProjectStatus.ACTIVE } },
    });
    const projectId = (projectResult as any).data.createProject.id;

    const name = `Fix bug gen1→gen2 ${Date.now()}`;
    const todoResult = await generateClient({ authMode: 'userPool' }).graphql({
      query: createTodo,
      variables: { input: { name, description: 'Shared data test', projectID: projectId } },
    });
    const todoId = (todoResult as any).data.createTodo.id;

    configureAmplify(gen2Config);
    const fetched = (
      (await generateClient({ authMode: 'userPool' }).graphql({
        query: getTodo,
        variables: { id: todoId },
      })) as any
    ).data.getTodo;

    expect(fetched).not.toBeNull();
    expect(fetched.id).toBe(todoId);
    expect(fetched.name).toBe(name);
    expect(fetched.projectID).toBe(projectId);
  }, 60_000);

  it('lambda: getRandomQuote returns consistent results via gen1 and gen2', async () => {
    configureAmplify(gen1Config);
    const gen1Result = (
      (await generateClient({ authMode: 'apiKey' }).graphql({
        query: getRandomQuote,
      })) as any
    ).data.getRandomQuote;

    configureAmplify(gen2Config);
    const gen2Result = (
      (await generateClient({ authMode: 'apiKey' }).graphql({
        query: getRandomQuote,
      })) as any
    ).data.getRandomQuote;

    expect(gen2Result.totalQuotes).toBe(gen1Result.totalQuotes);
  }, 60_000);

  it('storage: file uploaded via gen1 can be downloaded via gen2', async () => {
    const fileContent = `gen1-to-gen2-${Date.now()}`;
    const fileName = `test-g1g2-${Date.now()}.txt`;

    configureAmplify(gen1Config);
    const uploadResult = await uploadData({
      key: fileName,
      data: Buffer.from(fileContent),
      options: { contentType: 'text/plain' },
    }).result;
    expect(uploadResult.key).toBe(fileName);

    configureAmplify(gen2Config);
    const downloadResult = await downloadData({ path: `public/${fileName}` }).result;
    const body = await downloadResult.body.text();
    expect(body).toBe(fileContent);
  }, 120_000);
});

describe('gen2 to gen1', () => {
  let username: string;
  let password: string;

  beforeAll(async () => {
    configureAmplify(gen2Config);
    const creds = await signUp(gen2Config);
    username = creds.username;
    password = creds.password;
    await signIn({ username, password });
  }, 60_000);

  afterAll(async () => {
    try {
      await signOut();
    } catch {
      /* ignore */
    }
  });

  it('data: project created via gen2 can be read via gen1', async () => {
    configureAmplify(gen2Config);
    const title = `Board gen2→gen1 ${Date.now()}`;
    const result = await generateClient({ authMode: 'userPool' }).graphql({
      query: createProject,
      variables: { input: { title, status: ProjectStatus.ACTIVE, description: 'Shared data test' } },
    });
    const projectId = (result as any).data.createProject.id;

    configureAmplify(gen1Config);
    const fetched = (
      (await generateClient({ authMode: 'userPool' }).graphql({
        query: getProject,
        variables: { id: projectId },
      })) as any
    ).data.getProject;

    expect(fetched).not.toBeNull();
    expect(fetched.id).toBe(projectId);
    expect(fetched.title).toBe(title);
  }, 60_000);

  it('data: todo created via gen2 can be read via gen1', async () => {
    configureAmplify(gen2Config);
    const projectResult = await generateClient({ authMode: 'userPool' }).graphql({
      query: createProject,
      variables: { input: { title: `Todo Parent g2→g1 ${Date.now()}`, status: ProjectStatus.ACTIVE } },
    });
    const projectId = (projectResult as any).data.createProject.id;

    const name = `Deploy feature gen2→gen1 ${Date.now()}`;
    const todoResult = await generateClient({ authMode: 'userPool' }).graphql({
      query: createTodo,
      variables: { input: { name, description: 'Shared data test', projectID: projectId } },
    });
    const todoId = (todoResult as any).data.createTodo.id;

    configureAmplify(gen1Config);
    const fetched = (
      (await generateClient({ authMode: 'userPool' }).graphql({
        query: getTodo,
        variables: { id: todoId },
      })) as any
    ).data.getTodo;

    expect(fetched).not.toBeNull();
    expect(fetched.id).toBe(todoId);
    expect(fetched.name).toBe(name);
    expect(fetched.projectID).toBe(projectId);
  }, 60_000);

  it('lambda: getRandomQuote returns consistent results via gen2 and gen1', async () => {
    configureAmplify(gen2Config);
    const gen2Result = (
      (await generateClient({ authMode: 'apiKey' }).graphql({
        query: getRandomQuote,
      })) as any
    ).data.getRandomQuote;

    configureAmplify(gen1Config);
    const gen1Result = (
      (await generateClient({ authMode: 'apiKey' }).graphql({
        query: getRandomQuote,
      })) as any
    ).data.getRandomQuote;

    expect(gen1Result.totalQuotes).toBe(gen2Result.totalQuotes);
  }, 60_000);

  it('storage: file uploaded via gen2 can be downloaded via gen1', async () => {
    const fileContent = `gen2-to-gen1-${Date.now()}`;
    const fileName = `test-g2g1-${Date.now()}.txt`;

    configureAmplify(gen2Config);
    await uploadData({ path: `public/${fileName}`, data: Buffer.from(fileContent), options: { contentType: 'text/plain' } }).result;

    configureAmplify(gen1Config);
    const downloadResult = await downloadData({ key: fileName }).result;
    const body = await downloadResult.body.text();
    expect(body).toBe(fileContent);
  }, 120_000);
});
