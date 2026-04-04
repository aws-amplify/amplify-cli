/* eslint-disable @typescript-eslint/no-explicit-any */
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/api';
import { fetchAuthSession, signIn, signOut } from 'aws-amplify/auth';
import { uploadData } from 'aws-amplify/storage';
import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import * as fs from 'fs';
import { randomBytes } from 'crypto';
import { getNote, listNotes, generateThumbnail, addUserToGroup, removeUserFromGroup } from '../src/graphql/queries';
import { createNote, updateNote, deleteNote } from '../src/graphql/mutations';

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

describe('Note CRUD', () => {
  const client = () => generateClient({ authMode: 'userPool' });

  it('creates a note with correct fields', async () => {
    const input = {
      title: `Test Note ${Date.now()}`,
      content: 'Created by jest',
    };

    const result = await client().graphql({ query: createNote, variables: { input } });
    const note = (result as any).data.createNote;

    expect(typeof note.id).toBe('string');
    expect(note.id.length).toBeGreaterThan(0);
    expect(note.title).toBe(input.title);
    expect(note.content).toBe('Created by jest');
    expect(note.createdAt).toBeDefined();
    expect(note.updatedAt).toBeDefined();
    expect(note.owner).toBeDefined();
  });

  it('reads a note by id', async () => {
    const createResult = await client().graphql({
      query: createNote,
      variables: { input: { title: `Read Test ${Date.now()}`, content: 'For read test' } },
    });
    const created = (createResult as any).data.createNote;

    const getResult = await client().graphql({ query: getNote, variables: { id: created.id } });
    const fetched = (getResult as any).data.getNote;

    expect(fetched).not.toBeNull();
    expect(fetched.id).toBe(created.id);
    expect(fetched.title).toBe(created.title);
    expect(fetched.content).toBe('For read test');
  });

  it('updates a note and persists changes', async () => {
    const createResult = await client().graphql({
      query: createNote,
      variables: { input: { title: `Update Test ${Date.now()}`, content: 'Original' } },
    });
    const created = (createResult as any).data.createNote;

    await client().graphql({
      query: updateNote,
      variables: { input: { id: created.id, title: 'Updated Title', content: 'Now updated' } },
    });

    const getResult = await client().graphql({ query: getNote, variables: { id: created.id } });
    const fetched = (getResult as any).data.getNote;

    expect(fetched.title).toBe('Updated Title');
    expect(fetched.content).toBe('Now updated');
  });

  it('deletes a note', async () => {
    const createResult = await client().graphql({
      query: createNote,
      variables: { input: { title: `Delete Test ${Date.now()}`, content: 'Delete me' } },
    });
    const created = (createResult as any).data.createNote;

    await client().graphql({ query: deleteNote, variables: { input: { id: created.id } } });

    const getResult = await client().graphql({ query: getNote, variables: { id: created.id } });
    expect((getResult as any).data.getNote).toBeNull();
  });

  it('lists notes including a newly created one', async () => {
    const title = `List Test ${Date.now()}`;
    const createResult = await client().graphql({
      query: createNote,
      variables: { input: { title, content: 'For list test' } },
    });
    const created = (createResult as any).data.createNote;

    const listResult = await client().graphql({ query: listNotes });
    const items = (listResult as any).data.listNotes.items;

    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBeGreaterThanOrEqual(1);
    const found = items.find((n: any) => n.id === created.id);
    expect(found).toBeDefined();
    expect(found.title).toBe(title);
  });
});

describe('generateThumbnail Lambda', () => {
  it('uploads an image and generates a thumbnail', async () => {
    const testImageBase64 =
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const imageBuffer = Buffer.from(testImageBase64, 'base64');

    const uploadResult = await uploadData({
      path: ({ identityId }: { identityId: string }) => `private/${identityId}/media/test-${Date.now()}.png`,
      data: imageBuffer,
    }).result;

    const fullKey = uploadResult.path;
    expect(typeof fullKey).toBe('string');
    expect(fullKey.length).toBeGreaterThan(0);

    const publicClient = generateClient({ authMode: 'apiKey' });
    const result = await publicClient.graphql({
      query: generateThumbnail,
      variables: { mediaFileKey: fullKey },
    });
    const response = (result as any).data.generateThumbnail;

    expect(response).toBeDefined();
    expect(typeof response.statusCode).toBe('number');
    expect(typeof response.message).toBe('string');
    expect(response.message.length).toBeGreaterThan(0);
  });
});

describe('addUserToGroup Lambda', () => {
  it('adds the current user to a group', async () => {
    const session = await fetchAuthSession();
    const userSub = session.tokens?.idToken?.payload.sub as string;
    expect(typeof userSub).toBe('string');

    const publicClient = generateClient({ authMode: 'apiKey' });
    const result = await publicClient.graphql({
      query: addUserToGroup,
      variables: { userSub, group: 'Admin' },
    });
    const response = (result as any).data.addUserToGroup;

    expect(response).toBeDefined();
    expect(typeof response.statusCode).toBe('number');
    expect(typeof response.message).toBe('string');
    expect(response.message.length).toBeGreaterThan(0);
  });
});

describe('removeUserFromGroup Lambda', () => {
  it('removes the current user from a group', async () => {
    const session = await fetchAuthSession();
    const userSub = session.tokens?.idToken?.payload.sub as string;
    expect(typeof userSub).toBe('string');

    const publicClient = generateClient({ authMode: 'apiKey' });
    const result = await publicClient.graphql({
      query: removeUserFromGroup,
      variables: { userSub, group: 'Admin' },
    });
    const response = (result as any).data.removeUserFromGroup;

    expect(response).toBeDefined();
    expect(typeof response.statusCode).toBe('number');
    expect(typeof response.message).toBe('string');
    expect(response.message.length).toBeGreaterThan(0);
  });
});
