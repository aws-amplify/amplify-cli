/* eslint-disable @typescript-eslint/no-explicit-any */
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/api';
import { signIn, signOut } from 'aws-amplify/auth';
import { uploadData, getUrl, remove } from 'aws-amplify/storage';
import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import * as fs from 'fs';
import { randomBytes } from 'crypto';
import {
  getMoodItem, listMoodItems,
  getBoard, listBoards,
  moodItemsByBoardID,
  getRandomEmoji, getKinesisEvents,
} from '../src/graphql/queries';
import {
  createMoodItem, updateMoodItem, deleteMoodItem,
  createBoard, updateBoard, deleteBoard,
} from '../src/graphql/mutations';

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

  const email = generateTestEmail();
  const pwd = generateTestPassword();

  const cognitoClient = new CognitoIdentityProviderClient({ region });

  await cognitoClient.send(new AdminCreateUserCommand({
    UserPoolId: userPoolId,
    Username: email,
    TemporaryPassword: pwd,
    UserAttributes: [
      { Name: 'email', Value: email },
      { Name: 'email_verified', Value: 'true' },
    ],
    MessageAction: 'SUPPRESS',
  }));

  await cognitoClient.send(new AdminSetUserPasswordCommand({
    UserPoolId: userPoolId,
    Username: email,
    Password: pwd,
    Permanent: true,
  }));

  return { username: email, password: pwd };
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

describe('Board', () => {
  const client = () => generateClient({ authMode: 'apiKey' });

  it('creates a board with correct fields', async () => {
    const name = `Test Board ${Date.now()}`;
    const result = await client().graphql({
      query: createBoard,
      variables: { input: { name } },
    });
    const board = (result as any).data.createBoard;

    expect(typeof board.id).toBe('string');
    expect(board.id.length).toBeGreaterThan(0);
    expect(board.name).toBe(name);
    expect(board.createdAt).toBeDefined();
    expect(board.updatedAt).toBeDefined();
  });

  it('reads a board by id', async () => {
    const name = `Read Board ${Date.now()}`;
    const createResult = await client().graphql({
      query: createBoard,
      variables: { input: { name } },
    });
    const created = (createResult as any).data.createBoard;

    const getResult = await client().graphql({ query: getBoard, variables: { id: created.id } });
    const fetched = (getResult as any).data.getBoard;

    expect(fetched).not.toBeNull();
    expect(fetched.id).toBe(created.id);
    expect(fetched.name).toBe(name);
  });

  it('updates a board and persists changes', async () => {
    const createResult = await client().graphql({
      query: createBoard,
      variables: { input: { name: `Update Board ${Date.now()}` } },
    });
    const created = (createResult as any).data.createBoard;

    const updatedName = `Updated Board ${Date.now()}`;
    await client().graphql({
      query: updateBoard,
      variables: { input: { id: created.id, name: updatedName } },
    });

    const getResult = await client().graphql({ query: getBoard, variables: { id: created.id } });
    const fetched = (getResult as any).data.getBoard;

    expect(fetched.name).toBe(updatedName);
  });

  it('deletes a board', async () => {
    const createResult = await client().graphql({
      query: createBoard,
      variables: { input: { name: `Delete Board ${Date.now()}` } },
    });
    const created = (createResult as any).data.createBoard;

    await client().graphql({ query: deleteBoard, variables: { input: { id: created.id } } });

    const getResult = await client().graphql({ query: getBoard, variables: { id: created.id } });
    expect((getResult as any).data.getBoard).toBeNull();
  });

  it('lists boards including a newly created one', async () => {
    const name = `List Board ${Date.now()}`;
    const createResult = await client().graphql({
      query: createBoard,
      variables: { input: { name } },
    });
    const created = (createResult as any).data.createBoard;

    const listResult = await client().graphql({ query: listBoards });
    const items = (listResult as any).data.listBoards.items;

    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBeGreaterThanOrEqual(1);
    const found = items.find((b: any) => b.id === created.id);
    expect(found).toBeDefined();
    expect(found.name).toBe(name);
  });
});


describe('MoodItem', () => {
  const client = () => generateClient({ authMode: 'apiKey' });
  let boardId: string;

  beforeAll(async () => {
    const result = await client().graphql({
      query: createBoard,
      variables: { input: { name: `MoodItem Parent ${Date.now()}` } },
    });
    boardId = (result as any).data.createBoard.id;
  });

  it('creates a mood item with correct fields', async () => {
    const input = {
      title: `Test Mood ${Date.now()}`,
      description: 'A test mood item',
      image: 'https://example.com/test-mood.png',
      boardID: boardId,
    };

    const result = await client().graphql({ query: createMoodItem, variables: { input } });
    const item = (result as any).data.createMoodItem;

    expect(typeof item.id).toBe('string');
    expect(item.id.length).toBeGreaterThan(0);
    expect(item.title).toBe(input.title);
    expect(item.description).toBe('A test mood item');
    expect(item.image).toBe('https://example.com/test-mood.png');
    expect(item.boardID).toBe(boardId);
    expect(item.createdAt).toBeDefined();
    expect(item.updatedAt).toBeDefined();
  });

  it('reads a mood item by id', async () => {
    const title = `Read Mood ${Date.now()}`;
    const createResult = await client().graphql({
      query: createMoodItem,
      variables: { input: { title, description: 'For read test', image: 'https://example.com/read.png', boardID: boardId } },
    });
    const created = (createResult as any).data.createMoodItem;

    const getResult = await client().graphql({ query: getMoodItem, variables: { id: created.id } });
    const fetched = (getResult as any).data.getMoodItem;

    expect(fetched).not.toBeNull();
    expect(fetched.id).toBe(created.id);
    expect(fetched.title).toBe(title);
    expect(fetched.description).toBe('For read test');
    expect(fetched.image).toBe('https://example.com/read.png');
    expect(fetched.boardID).toBe(boardId);
  });

  it('updates a mood item and persists changes', async () => {
    const createResult = await client().graphql({
      query: createMoodItem,
      variables: { input: { title: `Update Mood ${Date.now()}`, description: 'Original', boardID: boardId } },
    });
    const created = (createResult as any).data.createMoodItem;

    const updatedTitle = `Updated Mood ${Date.now()}`;
    await client().graphql({
      query: updateMoodItem,
      variables: { input: { id: created.id, title: updatedTitle, description: 'Now updated' } },
    });

    const getResult = await client().graphql({ query: getMoodItem, variables: { id: created.id } });
    const fetched = (getResult as any).data.getMoodItem;

    expect(fetched.title).toBe(updatedTitle);
    expect(fetched.description).toBe('Now updated');
  });

  it('deletes a mood item', async () => {
    const createResult = await client().graphql({
      query: createMoodItem,
      variables: { input: { title: `Delete Mood ${Date.now()}`, boardID: boardId } },
    });
    const created = (createResult as any).data.createMoodItem;

    await client().graphql({ query: deleteMoodItem, variables: { input: { id: created.id } } });

    const getResult = await client().graphql({ query: getMoodItem, variables: { id: created.id } });
    expect((getResult as any).data.getMoodItem).toBeNull();
  });

  it('lists mood items including a newly created one', async () => {
    const title = `List Mood ${Date.now()}`;
    const createResult = await client().graphql({
      query: createMoodItem,
      variables: { input: { title, boardID: boardId } },
    });
    const created = (createResult as any).data.createMoodItem;

    const listResult = await client().graphql({ query: listMoodItems });
    const items = (listResult as any).data.listMoodItems.items;

    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBeGreaterThanOrEqual(1);
    const found = items.find((m: any) => m.id === created.id);
    expect(found).toBeDefined();
    expect(found.title).toBe(title);
  });
});


describe('moodItemsByBoardID', () => {
  const client = () => generateClient({ authMode: 'apiKey' });

  it('returns mood items filtered by board ID', async () => {
    const boardResult = await client().graphql({
      query: createBoard,
      variables: { input: { name: `ByBoardID Test ${Date.now()}` } },
    });
    const boardId = (boardResult as any).data.createBoard.id;

    const title = `ByBoard Mood ${Date.now()}`;
    await client().graphql({
      query: createMoodItem,
      variables: { input: { title, description: 'For byBoardID test', boardID: boardId } },
    });

    const result = await client().graphql({ query: moodItemsByBoardID, variables: { boardID: boardId } });
    const items = (result as any).data.moodItemsByBoardID.items;

    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBeGreaterThanOrEqual(1);
    const found = items.find((m: any) => m.title === title);
    expect(found).toBeDefined();
    expect(found.boardID).toBe(boardId);
  });
});

describe('Lambda Functions', () => {
  const client = () => generateClient({ authMode: 'userPool' });

  it('getRandomEmoji returns a string emoji', async () => {
    const result = await client().graphql({ query: getRandomEmoji });
    const emoji = (result as any).data.getRandomEmoji;

    expect(typeof emoji).toBe('string');
    expect(emoji.length).toBeGreaterThan(0);
  });

  it('getKinesisEvents returns parseable JSON', async () => {
    const result = await client().graphql({ query: getKinesisEvents });
    const raw = (result as any).data.getKinesisEvents;

    expect(typeof raw).toBe('string');
    const parsed = JSON.parse(raw);
    expect(parsed).toBeDefined();
    expect(typeof parsed).toBe('object');
  });
});

describe('S3 Storage', () => {
  it('uploads, gets URL, and removes a file', async () => {
    const testImageBase64 =
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const imageBuffer = Buffer.from(testImageBase64, 'base64');
    const fileName = `test-mood-image-${Date.now()}.png`;

    const uploadResult = await uploadData({
      key: fileName,
      data: imageBuffer,
      options: { contentType: 'image/png' },
    }).result;

    expect(uploadResult.key).toBe(fileName);

    const urlResult = await getUrl({
      key: fileName,
      options: { expiresIn: 3600 },
    });

    expect(urlResult.url).toBeDefined();
    expect(urlResult.url.toString()).toContain(fileName);

    await remove({ key: fileName });
  });
});
