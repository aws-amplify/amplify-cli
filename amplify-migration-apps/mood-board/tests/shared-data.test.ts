/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Validates that the gen2-migration refactor correctly shares stateful resources
 * (AppSync/DynamoDB, S3 bucket, Lambda, Kinesis) between gen1 and gen2 configurations.
 *
 * Auth sharing is tested separately in shared-auth.test.ts.
 * Tests both directions: gen1→gen2 and gen2→gen1.
 */
import { generateClient } from 'aws-amplify/api';
import { signIn, signOut } from 'aws-amplify/auth';
import { uploadData, downloadData } from 'aws-amplify/storage';
import { record, flushEvents } from 'aws-amplify/analytics/kinesis';
import { signUp, configureAmplify } from './signup';
import { createBoard, createMoodItem } from '../src/graphql/mutations';
import { getBoard, getMoodItem, getRandomEmoji, getKinesisEvents } from '../src/graphql/queries';
import * as fs from 'fs';

const gen1Config = JSON.parse(fs.readFileSync('src/amplifyconfiguration.json', { encoding: 'utf-8' }));
const gen2Config = JSON.parse(fs.readFileSync('amplify_outputs.json', { encoding: 'utf-8' }));

const GEN1_ENV_NAME = process.env.GEN1_ENV_NAME;
if (!GEN1_ENV_NAME) {
  throw new Error(`Missing GEN1_ENV_NAME env variable`);
}

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

  it('data: board created via gen1 can be read via gen2', async () => {
    configureAmplify(gen1Config);
    const name = `Inspiration gen1→gen2 ${Date.now()}`;
    const result = await generateClient({ authMode: 'apiKey' }).graphql({
      query: createBoard,
      variables: { input: { name } },
    });
    const boardId = (result as any).data.createBoard.id;

    configureAmplify(gen2Config);
    const fetched = (
      (await generateClient({ authMode: 'apiKey' }).graphql({
        query: getBoard,
        variables: { id: boardId },
      })) as any
    ).data.getBoard;

    expect(fetched).not.toBeNull();
    expect(fetched.id).toBe(boardId);
    expect(fetched.name).toBe(name);
  }, 60_000);

  it('data: mood item created via gen1 can be read via gen2', async () => {
    configureAmplify(gen1Config);
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

    configureAmplify(gen2Config);
    const fetched = (
      (await generateClient({ authMode: 'apiKey' }).graphql({
        query: getMoodItem,
        variables: { id: itemId },
      })) as any
    ).data.getMoodItem;

    expect(fetched).not.toBeNull();
    expect(fetched.id).toBe(itemId);
    expect(fetched.title).toBe(title);
    expect(fetched.boardID).toBe(boardId);
  }, 60_000);

  it('lambda: getRandomEmoji returns results via both gen1 and gen2', async () => {
    configureAmplify(gen1Config);
    const gen1Emoji = (
      (await generateClient({ authMode: 'userPool' }).graphql({
        query: getRandomEmoji,
      })) as any
    ).data.getRandomEmoji;
    expect(typeof gen1Emoji).toBe('string');
    expect(gen1Emoji.length).toBeGreaterThan(0);

    configureAmplify(gen2Config);
    const gen2Emoji = (
      (await generateClient({ authMode: 'userPool' }).graphql({
        query: getRandomEmoji,
      })) as any
    ).data.getRandomEmoji;
    expect(typeof gen2Emoji).toBe('string');
    expect(gen2Emoji.length).toBeGreaterThan(0);
  }, 60_000);

  it('analytics: Kinesis events recorded via gen1 are readable via gen2', async () => {
    configureAmplify(gen1Config);
    const marker = `g1→g2-${Date.now()}`;
    for (let i = 0; i < 5; i++) {
      record({
        data: { event: 'sharedDataTest', marker, index: i },
        partitionKey: 'test',
        streamName: `moodboardKinesis-${GEN1_ENV_NAME}`,
      });
    }
    flushEvents();
    await new Promise((r) => setTimeout(r, 3000));

    configureAmplify(gen2Config);
    let markedEvents: any[] = [];
    for (let attempt = 0; attempt < 10; attempt++) {
      const result = await generateClient({ authMode: 'userPool' }).graphql({ query: getKinesisEvents });
      const raw = (result as any).data.getKinesisEvents;
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      const events = parsed?.events ?? [];
      markedEvents = events.filter((e: any) => JSON.parse(e.data)?.marker === marker);
      if (markedEvents.length > 0) break;
      await new Promise((r) => setTimeout(r, 3000));
    }
    expect(markedEvents.length).toBeGreaterThan(0);
  }, 120_000);

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
    const downloadResult = await downloadData({
      path: `public/${fileName}`,
    }).result;
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

  it('data: board created via gen2 can be read via gen1', async () => {
    configureAmplify(gen2Config);
    const name = `Inspiration gen2→gen1 ${Date.now()}`;
    const result = await generateClient({ authMode: 'apiKey' }).graphql({
      query: createBoard,
      variables: { input: { name } },
    });
    const boardId = (result as any).data.createBoard.id;

    configureAmplify(gen1Config);
    const fetched = (
      (await generateClient({ authMode: 'apiKey' }).graphql({
        query: getBoard,
        variables: { id: boardId },
      })) as any
    ).data.getBoard;

    expect(fetched).not.toBeNull();
    expect(fetched.id).toBe(boardId);
    expect(fetched.name).toBe(name);
  }, 60_000);

  it('data: mood item created via gen2 can be read via gen1', async () => {
    configureAmplify(gen2Config);
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

    configureAmplify(gen1Config);
    const fetched = (
      (await generateClient({ authMode: 'apiKey' }).graphql({
        query: getMoodItem,
        variables: { id: itemId },
      })) as any
    ).data.getMoodItem;

    expect(fetched).not.toBeNull();
    expect(fetched.id).toBe(itemId);
    expect(fetched.title).toBe(title);
    expect(fetched.boardID).toBe(boardId);
  }, 60_000);

  it('lambda: getRandomEmoji returns results via both gen2 and gen1', async () => {
    configureAmplify(gen2Config);
    const gen2Emoji = (
      (await generateClient({ authMode: 'userPool' }).graphql({
        query: getRandomEmoji,
      })) as any
    ).data.getRandomEmoji;
    expect(typeof gen2Emoji).toBe('string');
    expect(gen2Emoji.length).toBeGreaterThan(0);

    configureAmplify(gen1Config);
    const gen1Emoji = (
      (await generateClient({ authMode: 'userPool' }).graphql({
        query: getRandomEmoji,
      })) as any
    ).data.getRandomEmoji;
    expect(typeof gen1Emoji).toBe('string');
    expect(gen1Emoji.length).toBeGreaterThan(0);
  }, 60_000);

  it('analytics: Kinesis events recorded via gen1 are readable via gen1', async () => {
    configureAmplify(gen2Config);
    const marker = `g2→g1-${Date.now()}`;
    for (let i = 0; i < 5; i++) {
      record({
        data: { event: 'sharedDataTest', marker, index: i },
        partitionKey: 'test',
        streamName: `moodboardKinesis-${GEN1_ENV_NAME}`,
      });
    }
    flushEvents();
    await new Promise((r) => setTimeout(r, 3000));

    configureAmplify(gen1Config);
    let markedEvents: any[] = [];
    for (let attempt = 0; attempt < 10; attempt++) {
      const result = await generateClient({ authMode: 'userPool' }).graphql({ query: getKinesisEvents });
      const raw = (result as any).data.getKinesisEvents;
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      const events = parsed?.events ?? [];
      markedEvents = events.filter((e: any) => JSON.parse(e.data)?.marker === marker);
      if (markedEvents.length > 0) break;
      await new Promise((r) => setTimeout(r, 3000));
    }
    expect(markedEvents.length).toBeGreaterThan(0);
  }, 120_000);

  it('storage: file uploaded via gen2 can be downloaded via gen1', async () => {
    const fileContent = `gen2-to-gen1-${Date.now()}`;
    const fileName = `test-g2g1-${Date.now()}.txt`;

    configureAmplify(gen2Config);
    await uploadData({
      path: `public/${fileName}`,
      data: Buffer.from(fileContent),
      options: { contentType: 'text/plain' },
    }).result;

    configureAmplify(gen1Config);
    const downloadResult = await downloadData({
      key: fileName,
    }).result;
    const body = await downloadResult.body.text();
    expect(body).toBe(fileContent);
  }, 120_000);
});
