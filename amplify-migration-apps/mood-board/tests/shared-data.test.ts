/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Validates that the gen2-migration refactor correctly shares stateful resources
 * (Cognito user pool, AppSync/DynamoDB, S3 bucket, Lambda, Kinesis) between
 * gen1 and gen2 configurations.
 *
 * Tests both directions: gen1→gen2 and gen2→gen1.
 */
import { generateClient } from 'aws-amplify/api';
import { getCurrentUser, signIn, signOut } from 'aws-amplify/auth';
import { uploadData, downloadData } from 'aws-amplify/storage';
import { record, flushEvents } from 'aws-amplify/analytics/kinesis';
import { signUp, configureAmplify } from './signup';
import { createBoard, createMoodItem } from '../src/graphql/mutations';
import { getBoard, getMoodItem, getRandomEmoji, getKinesisEvents } from '../src/graphql/queries';
import { KINESIS_STREAM_NAME } from '../src/constants';
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

  it('data: board created via gen1 can be read via gen2', async () => {
    configureAmplify(gen1Config);
    await signIn({ username, password });

    const name = `Inspiration gen1→gen2 ${Date.now()}`;
    const result = await generateClient({ authMode: 'apiKey' }).graphql({
      query: createBoard,
      variables: { input: { name } },
    });
    const boardId = (result as any).data.createBoard.id;
    await signOut();

    configureAmplify(gen2Config);
    await signIn({ username, password });

    const fetched = (await generateClient({ authMode: 'apiKey' }).graphql({
      query: getBoard,
      variables: { id: boardId },
    }) as any).data.getBoard;

    expect(fetched).not.toBeNull();
    expect(fetched.id).toBe(boardId);
    expect(fetched.name).toBe(name);
    await signOut();
  }, 60_000);

  it('data: mood item created via gen1 can be read via gen2', async () => {
    configureAmplify(gen1Config);
    await signIn({ username, password });

    const boardResult = await generateClient({ authMode: 'apiKey' }).graphql({
      query: createBoard,
      variables: { input: { name: `Item Parent g1→g2 ${Date.now()}` } },
    });
    const boardId = (boardResult as any).data.createBoard.id;

    const title = `Sunset photo gen1→gen2 ${Date.now()}`;
    const itemResult = await generateClient({ authMode: 'apiKey' }).graphql({
      query: createMoodItem,
      variables: { input: { title, image: 'https://example.com/sunset.png', boardID: boardId } },
    });
    const itemId = (itemResult as any).data.createMoodItem.id;
    await signOut();

    configureAmplify(gen2Config);
    await signIn({ username, password });

    const fetched = (await generateClient({ authMode: 'apiKey' }).graphql({
      query: getMoodItem,
      variables: { id: itemId },
    }) as any).data.getMoodItem;

    expect(fetched).not.toBeNull();
    expect(fetched.id).toBe(itemId);
    expect(fetched.title).toBe(title);
    expect(fetched.boardID).toBe(boardId);
    await signOut();
  }, 60_000);

  it('lambda: getRandomEmoji returns results via both gen1 and gen2', async () => {
    configureAmplify(gen1Config);
    await signIn({ username, password });

    const gen1Emoji = (await generateClient({ authMode: 'userPool' }).graphql({
      query: getRandomEmoji,
    }) as any).data.getRandomEmoji;
    expect(typeof gen1Emoji).toBe('string');
    expect(gen1Emoji.length).toBeGreaterThan(0);
    await signOut();

    configureAmplify(gen2Config);
    await signIn({ username, password });

    const gen2Emoji = (await generateClient({ authMode: 'userPool' }).graphql({
      query: getRandomEmoji,
    }) as any).data.getRandomEmoji;
    expect(typeof gen2Emoji).toBe('string');
    expect(gen2Emoji.length).toBeGreaterThan(0);
    await signOut();
  }, 60_000);

  it('analytics: Kinesis events recorded via gen1 are readable via gen2', async () => {
    configureAmplify(gen1Config);
    await signIn({ username, password });

    const marker = `g1→g2-${Date.now()}`;
    for (let i = 0; i < 5; i++) {
      record({
        data: { event: 'sharedDataTest', marker, index: i },
        partitionKey: 'test',
        streamName: KINESIS_STREAM_NAME,
      });
    }
    flushEvents();
    await new Promise((r) => setTimeout(r, 3000));
    await signOut();

    configureAmplify(gen2Config);
    await signIn({ username, password });

    let events: any[] = [];
    for (let attempt = 0; attempt < 10; attempt++) {
      const result = await generateClient({ authMode: 'userPool' }).graphql({ query: getKinesisEvents });
      const raw = (result as any).data.getKinesisEvents;
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      events = parsed?.events ?? [];
      if (events.length > 0) break;
      await new Promise((r) => setTimeout(r, 3000));
    }

    expect(events.length).toBeGreaterThan(0);
    await signOut();
  }, 120_000);

  it('storage: file uploaded via gen1 can be downloaded via gen2', async () => {
    const fileContent = `gen1-to-gen2-${Date.now()}`;
    const fileName = `test-g1g2-${Date.now()}.txt`;

    configureAmplify(gen1Config);
    await signIn({ username, password });

    const uploadResult = await uploadData({
      key: fileName,
      data: Buffer.from(fileContent),
      options: { contentType: 'text/plain' },
    }).result;
    expect(uploadResult.key).toBe(fileName);
    await signOut();

    configureAmplify(gen2Config);
    await signIn({ username, password });

    const downloadResult = await downloadData({
      path: `public/${fileName}`,
    }).result;
    const body = await downloadResult.body.text();
    expect(body).toBe(fileContent);
    await signOut();
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

  it('data: board created via gen2 can be read via gen1', async () => {
    configureAmplify(gen2Config);
    await signIn({ username, password });

    const name = `Inspiration gen2→gen1 ${Date.now()}`;
    const result = await generateClient({ authMode: 'apiKey' }).graphql({
      query: createBoard,
      variables: { input: { name } },
    });
    const boardId = (result as any).data.createBoard.id;
    await signOut();

    configureAmplify(gen1Config);
    await signIn({ username, password });

    const fetched = (await generateClient({ authMode: 'apiKey' }).graphql({
      query: getBoard,
      variables: { id: boardId },
    }) as any).data.getBoard;

    expect(fetched).not.toBeNull();
    expect(fetched.id).toBe(boardId);
    expect(fetched.name).toBe(name);
    await signOut();
  }, 60_000);

  it('data: mood item created via gen2 can be read via gen1', async () => {
    configureAmplify(gen2Config);
    await signIn({ username, password });

    const boardResult = await generateClient({ authMode: 'apiKey' }).graphql({
      query: createBoard,
      variables: { input: { name: `Item Parent g2→g1 ${Date.now()}` } },
    });
    const boardId = (boardResult as any).data.createBoard.id;

    const title = `Mountain view gen2→gen1 ${Date.now()}`;
    const itemResult = await generateClient({ authMode: 'apiKey' }).graphql({
      query: createMoodItem,
      variables: { input: { title, image: 'https://example.com/mountain.png', boardID: boardId } },
    });
    const itemId = (itemResult as any).data.createMoodItem.id;
    await signOut();

    configureAmplify(gen1Config);
    await signIn({ username, password });

    const fetched = (await generateClient({ authMode: 'apiKey' }).graphql({
      query: getMoodItem,
      variables: { id: itemId },
    }) as any).data.getMoodItem;

    expect(fetched).not.toBeNull();
    expect(fetched.id).toBe(itemId);
    expect(fetched.title).toBe(title);
    expect(fetched.boardID).toBe(boardId);
    await signOut();
  }, 60_000);

  it('lambda: getRandomEmoji returns results via both gen2 and gen1', async () => {
    configureAmplify(gen2Config);
    await signIn({ username, password });

    const gen2Emoji = (await generateClient({ authMode: 'userPool' }).graphql({
      query: getRandomEmoji,
    }) as any).data.getRandomEmoji;
    expect(typeof gen2Emoji).toBe('string');
    expect(gen2Emoji.length).toBeGreaterThan(0);
    await signOut();

    configureAmplify(gen1Config);
    await signIn({ username, password });

    const gen1Emoji = (await generateClient({ authMode: 'userPool' }).graphql({
      query: getRandomEmoji,
    }) as any).data.getRandomEmoji;
    expect(typeof gen1Emoji).toBe('string');
    expect(gen1Emoji.length).toBeGreaterThan(0);
    await signOut();
  }, 60_000);

  it('analytics: Kinesis events recorded via gen2 are readable via gen1', async () => {
    configureAmplify(gen2Config);
    await signIn({ username, password });

    const marker = `g2→g1-${Date.now()}`;
    for (let i = 0; i < 5; i++) {
      record({
        data: { event: 'sharedDataTest', marker, index: i },
        partitionKey: 'test',
        streamName: KINESIS_STREAM_NAME,
      });
    }
    flushEvents();
    await new Promise((r) => setTimeout(r, 3000));
    await signOut();

    configureAmplify(gen1Config);
    await signIn({ username, password });

    let events: any[] = [];
    for (let attempt = 0; attempt < 10; attempt++) {
      const result = await generateClient({ authMode: 'userPool' }).graphql({ query: getKinesisEvents });
      const raw = (result as any).data.getKinesisEvents;
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      events = parsed?.events ?? [];
      if (events.length > 0) break;
      await new Promise((r) => setTimeout(r, 3000));
    }

    expect(events.length).toBeGreaterThan(0);
    await signOut();
  }, 120_000);

  it('storage: file uploaded via gen2 can be downloaded via gen1', async () => {
    const fileContent = `gen2-to-gen1-${Date.now()}`;
    const fileName = `test-g2g1-${Date.now()}.txt`;

    configureAmplify(gen2Config);
    await signIn({ username, password });

    await uploadData({
      path: `public/${fileName}`,
      data: Buffer.from(fileContent),
      options: { contentType: 'text/plain' },
    }).result;
    await signOut();

    configureAmplify(gen1Config);
    await signIn({ username, password });

    const downloadResult = await downloadData({
      key: fileName,
    }).result;
    const body = await downloadResult.body.text();
    expect(body).toBe(fileContent);
    await signOut();
  }, 120_000);
});
