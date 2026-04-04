/* eslint-disable @typescript-eslint/no-explicit-any */
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/api';
import { signIn, signOut } from 'aws-amplify/auth';
import { uploadData, getUrl, downloadData, getProperties } from 'aws-amplify/storage';
import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import * as fs from 'fs';
import { randomBytes } from 'crypto';
import { getProject, getTodo, listProjects, listTodos } from '../src/graphql/queries';
import {
  createProject, updateProject, deleteProject,
  createTodo, updateTodo, deleteTodo,
} from '../src/graphql/mutations';
import { ProjectStatus } from '../src/API';

import { webcrypto } from 'crypto';
if (typeof globalThis.crypto === 'undefined') {
  (globalThis as any).crypto = webcrypto;
}

const CONFIG_PATH = process.env.APP_CONFIG_PATH;
if (!CONFIG_PATH) {
  throw new Error('APP_CONFIG_PATH environment variable is required');
}
const config = JSON.parse(fs.readFileSync(CONFIG_PATH, { encoding: 'utf-8' }));
Amplify.configure(config);

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

let username: string;
let password: string;

async function signUp(cfg: any): Promise<{ username: string; password: string }> {
  const gen2Auth = (cfg as any)?.auth;
  const userPoolId = cfg.aws_user_pools_id ?? gen2Auth?.user_pool_id;
  const region = cfg.aws_cognito_region ?? gen2Auth?.aws_region;

  const uname = generateTestEmail();
  const pwd = generateTestPassword();

  const cognitoClient = new CognitoIdentityProviderClient({ region });

  await cognitoClient.send(new AdminCreateUserCommand({
    UserPoolId: userPoolId,
    Username: uname,
    TemporaryPassword: pwd,
    UserAttributes: [
      { Name: 'email', Value: uname },
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

  return { username: uname, password: pwd };
}

function generateTestPassword(): string {
  return `Test${randomSuffix()}!Aa1`;
}

function generateTestEmail(): string {
  return `testuser-${randomSuffix()}@test.example.com`;
}

function randomSuffix(): string {
  return randomBytes(4).toString('hex');
}

beforeAll(async () => {
  const creds = await signUp(config);
  username = creds.username;
  password = creds.password;
  await signIn({ username, password });
}, 60_000);

afterAll(async () => {
  await signOut();
});

describe('getRandomQuote', () => {
  const publicClient = () => generateClient({ authMode: 'apiKey' });

  it('returns a quote with all expected fields', async () => {
    const result = await publicClient().graphql({ query: getRandomQuote });
    const quote = (result as any).data.getRandomQuote;

    expect(quote).toBeDefined();
    expect(typeof quote.message).toBe('string');
    expect(quote.message.length).toBeGreaterThan(0);
    expect(typeof quote.quote).toBe('string');
    expect(quote.quote.length).toBeGreaterThan(0);
    expect(typeof quote.author).toBe('string');
    expect(quote.author.length).toBeGreaterThan(0);
    expect(typeof quote.timestamp).toBe('string');
    expect(quote.timestamp.length).toBeGreaterThan(0);
    expect(typeof quote.totalQuotes).toBe('number');
    expect(quote.totalQuotes).toBeGreaterThan(0);
  });
});

describe('Project', () => {
  const authClient = () => generateClient({ authMode: 'userPool' });
  const publicClient = () => generateClient({ authMode: 'apiKey' });

  it('creates a project with correct fields', async () => {
    const deadline = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const input = {
      title: `Test Project ${Date.now()}`,
      status: ProjectStatus.ACTIVE,
      description: 'Created by jest',
      deadline,
      color: '#007bff',
    };

    const result = await authClient().graphql({ query: createProject, variables: { input } });
    const project = (result as any).data.createProject;

    expect(typeof project.id).toBe('string');
    expect(project.id.length).toBeGreaterThan(0);
    expect(project.title).toBe(input.title);
    expect(project.status).toBe(ProjectStatus.ACTIVE);
    expect(project.description).toBe('Created by jest');
    expect(project.deadline).toBe(deadline);
    expect(project.color).toBe('#007bff');
    expect(project.createdAt).toBeDefined();
    expect(project.updatedAt).toBeDefined();
    expect(project.owner).toBeDefined();
  });

  it('reads a project by id with apiKey', async () => {
    const createResult = await authClient().graphql({
      query: createProject,
      variables: { input: { title: `Read Test ${Date.now()}`, status: ProjectStatus.COMPLETED, description: 'For read test' } },
    });
    const created = (createResult as any).data.createProject;

    const getResult = await publicClient().graphql({ query: getProject, variables: { id: created.id } });
    const fetched = (getResult as any).data.getProject;

    expect(fetched).not.toBeNull();
    expect(fetched.id).toBe(created.id);
    expect(fetched.title).toBe(created.title);
    expect(fetched.status).toBe(ProjectStatus.COMPLETED);
    expect(fetched.description).toBe('For read test');
  });

  it('updates a project and persists changes', async () => {
    const createResult = await authClient().graphql({
      query: createProject,
      variables: { input: { title: `Update Test ${Date.now()}`, status: ProjectStatus.ACTIVE, color: '#000000' } },
    });
    const created = (createResult as any).data.createProject;

    await authClient().graphql({
      query: updateProject,
      variables: { input: { id: created.id, title: 'Updated Title', status: ProjectStatus.ON_HOLD, color: '#28a745', description: 'Now updated' } },
    });

    const getResult = await publicClient().graphql({ query: getProject, variables: { id: created.id } });
    const fetched = (getResult as any).data.getProject;

    expect(fetched.title).toBe('Updated Title');
    expect(fetched.status).toBe(ProjectStatus.ON_HOLD);
    expect(fetched.color).toBe('#28a745');
    expect(fetched.description).toBe('Now updated');
  });

  it('deletes a project', async () => {
    const createResult = await authClient().graphql({
      query: createProject,
      variables: { input: { title: `Delete Test ${Date.now()}`, status: ProjectStatus.ARCHIVED } },
    });
    const created = (createResult as any).data.createProject;

    await authClient().graphql({ query: deleteProject, variables: { input: { id: created.id } } });

    const getResult = await publicClient().graphql({ query: getProject, variables: { id: created.id } });
    expect((getResult as any).data.getProject).toBeNull();
  });

  it('lists projects including a newly created one', async () => {
    const title = `List Test ${Date.now()}`;
    const createResult = await authClient().graphql({
      query: createProject,
      variables: { input: { title, status: ProjectStatus.ACTIVE } },
    });
    const created = (createResult as any).data.createProject;

    const listResult = await publicClient().graphql({ query: listProjects });
    const items = (listResult as any).data.listProjects.items;

    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBeGreaterThanOrEqual(1);
    const found = items.find((p: any) => p.id === created.id);
    expect(found).toBeDefined();
    expect(found.title).toBe(title);
  });
});

describe('Todo', () => {
  const authClient = () => generateClient({ authMode: 'userPool' });
  const publicClient = () => generateClient({ authMode: 'apiKey' });

  async function createParentProject(): Promise<string> {
    const result = await authClient().graphql({
      query: createProject,
      variables: { input: { title: `Todo Parent ${Date.now()}`, status: ProjectStatus.ACTIVE } },
    });
    return (result as any).data.createProject.id;
  }

  it('creates a todo linked to a project', async () => {
    const projectId = await createParentProject();
    const input = {
      name: `Test Todo ${Date.now()}`,
      description: 'Created by jest',
      projectID: projectId,
      images: [],
    };

    const result = await authClient().graphql({ query: createTodo, variables: { input } });
    const todo = (result as any).data.createTodo;

    expect(typeof todo.id).toBe('string');
    expect(todo.id.length).toBeGreaterThan(0);
    expect(todo.name).toBe(input.name);
    expect(todo.description).toBe('Created by jest');
    expect(todo.projectID).toBe(projectId);
    expect(todo.images).toEqual([]);
    expect(todo.createdAt).toBeDefined();
    expect(todo.updatedAt).toBeDefined();
    expect(todo.owner).toBeDefined();
  });

  it('reads a todo by id with apiKey', async () => {
    const projectId = await createParentProject();
    const createResult = await authClient().graphql({
      query: createTodo,
      variables: { input: { name: `Read Todo ${Date.now()}`, description: 'For read test', projectID: projectId, images: [] } },
    });
    const created = (createResult as any).data.createTodo;

    const getResult = await publicClient().graphql({ query: getTodo, variables: { id: created.id } });
    const fetched = (getResult as any).data.getTodo;

    expect(fetched).not.toBeNull();
    expect(fetched.id).toBe(created.id);
    expect(fetched.name).toBe(created.name);
    expect(fetched.description).toBe('For read test');
    expect(fetched.projectID).toBe(projectId);
  });

  it('updates a todo and persists changes', async () => {
    const projectId = await createParentProject();
    const createResult = await authClient().graphql({
      query: createTodo,
      variables: { input: { name: `Update Todo ${Date.now()}`, description: 'Original', projectID: projectId, images: [] } },
    });
    const created = (createResult as any).data.createTodo;

    await authClient().graphql({
      query: updateTodo,
      variables: { input: { id: created.id, name: 'Updated Todo', description: 'Now updated', projectID: projectId } },
    });

    const getResult = await publicClient().graphql({ query: getTodo, variables: { id: created.id } });
    const fetched = (getResult as any).data.getTodo;

    expect(fetched.name).toBe('Updated Todo');
    expect(fetched.description).toBe('Now updated');
    expect(fetched.projectID).toBe(projectId);
  });

  it('deletes a todo', async () => {
    const projectId = await createParentProject();
    const createResult = await authClient().graphql({
      query: createTodo,
      variables: { input: { name: `Delete Todo ${Date.now()}`, projectID: projectId, images: [] } },
    });
    const created = (createResult as any).data.createTodo;

    await authClient().graphql({ query: deleteTodo, variables: { input: { id: created.id } } });

    const getResult = await publicClient().graphql({ query: getTodo, variables: { id: created.id } });
    expect((getResult as any).data.getTodo).toBeNull();
  });

  it('lists todos including a newly created one', async () => {
    const projectId = await createParentProject();
    const name = `List Todo ${Date.now()}`;
    const createResult = await authClient().graphql({
      query: createTodo,
      variables: { input: { name, projectID: projectId, images: [] } },
    });
    const created = (createResult as any).data.createTodo;

    const listResult = await publicClient().graphql({ query: listTodos });
    const items = (listResult as any).data.listTodos.items;

    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBeGreaterThanOrEqual(1);
    const found = items.find((t: any) => t.id === created.id);
    expect(found).toBeDefined();
    expect(found.name).toBe(name);
  });
});

describe('S3 Storage', () => {
  const testImageBase64 =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

  it('uploads a file and returns the path', async () => {
    const imageBuffer = Buffer.from(testImageBase64, 'base64');
    const fileName = `test-image-${Date.now()}.png`;
    const s3Path = `public/images/${fileName}`;

    const result = await uploadData({
      path: s3Path,
      data: imageBuffer,
      options: { contentType: 'image/png' },
    }).result;

    expect(typeof result.path).toBe('string');
    expect(result.path).toContain(fileName);
  });

  it('gets a signed URL for an uploaded file', async () => {
    const imageBuffer = Buffer.from(testImageBase64, 'base64');
    const fileName = `test-url-${Date.now()}.png`;
    const s3Path = `public/images/${fileName}`;

    await uploadData({ path: s3Path, data: imageBuffer, options: { contentType: 'image/png' } }).result;

    const result = await getUrl({ path: s3Path, options: { expiresIn: 3600 } });

    expect(result.url).toBeDefined();
    const urlStr = result.url.toString();
    expect(urlStr).toContain('https://');
    expect(urlStr.length).toBeGreaterThan(0);
  });

  it('gets properties of an uploaded file', async () => {
    const imageBuffer = Buffer.from(testImageBase64, 'base64');
    const fileName = `test-props-${Date.now()}.png`;
    const s3Path = `public/images/${fileName}`;

    await uploadData({ path: s3Path, data: imageBuffer, options: { contentType: 'image/png' } }).result;

    const properties = await getProperties({ path: s3Path });

    expect(properties).toBeDefined();
    expect(properties.path).toBe(s3Path);
    expect((properties as any).contentType).toBe('image/png');
    expect(typeof (properties as any).size).toBe('number');
    expect((properties as any).size).toBeGreaterThan(0);
  });

  it('downloads an uploaded file with correct content', async () => {
    const imageBuffer = Buffer.from(testImageBase64, 'base64');
    const fileName = `test-download-${Date.now()}.png`;
    const s3Path = `public/images/${fileName}`;

    await uploadData({ path: s3Path, data: imageBuffer, options: { contentType: 'image/png' } }).result;

    const downloadResult = await downloadData({ path: s3Path }).result;
    const blob = await downloadResult.body.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    expect(buffer.length).toBeGreaterThan(0);
    expect(buffer.length).toBe(imageBuffer.length);
  });
});
