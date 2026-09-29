/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Validates that the gen2-migration refactor correctly shares stateful resources
 * (AppSync/DynamoDB, S3 bucket, Lambda) between gen1 and gen2 configurations.
 *
 * Auth sharing is tested separately in shared-auth.test.ts.
 * Tests both directions: gen1→gen2 and gen2→gen1.
 */
import { generateClient } from 'aws-amplify/api';
import { getCurrentUser, signIn, signOut } from 'aws-amplify/auth';
import { uploadData, downloadData } from 'aws-amplify/storage';
import { signUp, configureAmplify } from './signup';
import { createTopic } from '../src/graphql/mutations';
import { getTopic, fetchUserActivity } from '../src/graphql/queries';
import * as fs from 'fs';

const gen1Config = JSON.parse(fs.readFileSync('src/amplifyconfiguration.json', { encoding: 'utf-8' }));
const gen2Config = JSON.parse(fs.readFileSync('amplify_outputs.json', { encoding: 'utf-8' }));

describe('gen1 to gen2', () => {
  let username: string;
  let password: string;
  let userId: string;

  beforeAll(async () => {
    configureAmplify(gen1Config);
    const creds = await signUp(gen1Config);
    username = creds.username;
    password = creds.password;
    await signIn({ username, password });
    userId = (await getCurrentUser()).userId;
  }, 60_000);

  afterAll(async () => {
    try {
      await signOut();
    } catch {
      /* ignore */
    }
  });

  it('data: topic created via gen1 can be read via gen2', async () => {
    configureAmplify(gen1Config);
    const content = `tech:Gen1toGen2 ${Date.now()}`;
    const result = await generateClient({ authMode: 'apiKey' }).graphql({
      query: createTopic,
      variables: { input: { content, createdByUserId: userId } },
    });
    const topicId = (result as any).data.createTopic.id;

    configureAmplify(gen2Config);
    const fetched = (
      (await generateClient({ authMode: 'apiKey' }).graphql({
        query: getTopic,
        variables: { id: topicId },
      })) as any
    ).data.getTopic;

    expect(fetched).not.toBeNull();
    expect(fetched.id).toBe(topicId);
    expect(fetched.content).toBe(content);
  }, 60_000);

  it('activity: activity recorded via gen1 can be read via gen2', async () => {
    configureAmplify(gen1Config);
    await generateClient({ authMode: 'apiKey' }).graphql({
      query: createTopic,
      variables: { input: { content: `tech:Activity G1toG2 ${Date.now()}`, createdByUserId: userId } },
    });

    // Poll until the activity appears (stream trigger is async)
    let activities: any[] = [];
    for (let attempt = 0; attempt < 10; attempt++) {
      const result = await generateClient({ authMode: 'apiKey' }).graphql({
        query: fetchUserActivity,
        variables: { userId },
      });
      activities = (result as any).data.fetchUserActivity || [];
      if (activities.length > 0) break;
      await new Promise((r) => setTimeout(r, 2000));
    }

    configureAmplify(gen2Config);
    const gen2Result = await generateClient({ authMode: 'apiKey' }).graphql({
      query: fetchUserActivity,
      variables: { userId },
    });
    const gen2Activities = (gen2Result as any).data.fetchUserActivity || [];

    expect(gen2Activities.length).toBeGreaterThan(0);
    expect(gen2Activities[0].userId).toBe(userId);
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
  let userId: string;

  beforeAll(async () => {
    configureAmplify(gen2Config);
    const creds = await signUp(gen2Config);
    username = creds.username;
    password = creds.password;
    await signIn({ username, password });
    userId = (await getCurrentUser()).userId;
  }, 60_000);

  afterAll(async () => {
    try {
      await signOut();
    } catch {
      /* ignore */
    }
  });

  it('data: topic created via gen2 can be read via gen1', async () => {
    configureAmplify(gen2Config);
    const content = `tech:Gen2toGen1 ${Date.now()}`;
    const result = await generateClient({ authMode: 'apiKey' }).graphql({
      query: createTopic,
      variables: { input: { content, createdByUserId: userId } },
    });
    const topicId = (result as any).data.createTopic.id;

    configureAmplify(gen1Config);
    const fetched = (
      (await generateClient({ authMode: 'apiKey' }).graphql({
        query: getTopic,
        variables: { id: topicId },
      })) as any
    ).data.getTopic;

    expect(fetched).not.toBeNull();
    expect(fetched.id).toBe(topicId);
    expect(fetched.content).toBe(content);
  }, 60_000);

  it('activity: activity recorded via gen2 can be read via gen1', async () => {
    configureAmplify(gen2Config);
    await generateClient({ authMode: 'apiKey' }).graphql({
      query: createTopic,
      variables: { input: { content: `tech:Activity G2toG1 ${Date.now()}`, createdByUserId: userId } },
    });

    // Poll until the activity appears (stream trigger is async)
    let activities: any[] = [];
    for (let attempt = 0; attempt < 10; attempt++) {
      const result = await generateClient({ authMode: 'apiKey' }).graphql({
        query: fetchUserActivity,
        variables: { userId },
      });
      activities = (result as any).data.fetchUserActivity || [];
      if (activities.length > 0) break;
      await new Promise((r) => setTimeout(r, 2000));
    }

    configureAmplify(gen1Config);
    const gen1Result = await generateClient({ authMode: 'apiKey' }).graphql({
      query: fetchUserActivity,
      variables: { userId },
    });
    const gen1Activities = (gen1Result as any).data.fetchUserActivity || [];

    expect(gen1Activities.length).toBeGreaterThan(0);
    expect(gen1Activities[0].userId).toBe(userId);
  }, 60_000);

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
