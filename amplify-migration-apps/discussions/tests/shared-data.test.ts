/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Validates that the gen2-migration refactor correctly shares stateful resources
 * (Cognito user pool, AppSync/DynamoDB, S3 bucket) between gen1 and gen2 configurations.
 *
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

  it('data: topic created via gen1 can be read via gen2', async () => {
    configureAmplify(gen1Config);
    await signIn({ username, password });

    const currentUser = await getCurrentUser();
    const content = `tech:Gen1toGen2 ${Date.now()}`;
    const result = await generateClient({ authMode: 'apiKey' }).graphql({
      query: createTopic,
      variables: { input: { content, createdByUserId: currentUser.userId } },
    });
    const topicId = (result as any).data.createTopic.id;
    await signOut();

    configureAmplify(gen2Config);
    await signIn({ username, password });

    const fetched = (await generateClient({ authMode: 'apiKey' }).graphql({
      query: getTopic,
      variables: { id: topicId },
    }) as any).data.getTopic;

    expect(fetched).not.toBeNull();
    expect(fetched.id).toBe(topicId);
    expect(fetched.content).toBe(content);
    await signOut();
  }, 60_000);

  it('activity: activity recorded via gen1 can be read via gen2', async () => {
    configureAmplify(gen1Config);
    await signIn({ username, password });

    const currentUser = await getCurrentUser();
    await generateClient({ authMode: 'apiKey' }).graphql({
      query: createTopic,
      variables: { input: { content: `tech:Activity G1toG2 ${Date.now()}`, createdByUserId: currentUser.userId } },
    });

    // Poll until the activity appears (stream trigger is async)
    let activities: any[] = [];
    for (let attempt = 0; attempt < 10; attempt++) {
      const result = await generateClient({ authMode: 'apiKey' }).graphql({
        query: fetchUserActivity,
        variables: { userId: currentUser.userId },
      });
      activities = (result as any).data.fetchUserActivity || [];
      if (activities.length > 0) break;
      await new Promise((r) => setTimeout(r, 2000));
    }
    await signOut();

    // Read the same activity via gen2
    configureAmplify(gen2Config);
    await signIn({ username, password });

    const gen2Result = await generateClient({ authMode: 'apiKey' }).graphql({
      query: fetchUserActivity,
      variables: { userId: currentUser.userId },
    });
    const gen2Activities = (gen2Result as any).data.fetchUserActivity || [];

    expect(gen2Activities.length).toBeGreaterThan(0);
    expect(gen2Activities[0].userId).toBe(currentUser.userId);
    await signOut();
  }, 60_000);

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

  it('data: topic created via gen2 can be read via gen1', async () => {
    configureAmplify(gen2Config);
    await signIn({ username, password });

    const currentUser = await getCurrentUser();
    const content = `tech:Gen2toGen1 ${Date.now()}`;
    const result = await generateClient({ authMode: 'apiKey' }).graphql({
      query: createTopic,
      variables: { input: { content, createdByUserId: currentUser.userId } },
    });
    const topicId = (result as any).data.createTopic.id;
    await signOut();

    configureAmplify(gen1Config);
    await signIn({ username, password });

    const fetched = (await generateClient({ authMode: 'apiKey' }).graphql({
      query: getTopic,
      variables: { id: topicId },
    }) as any).data.getTopic;

    expect(fetched).not.toBeNull();
    expect(fetched.id).toBe(topicId);
    expect(fetched.content).toBe(content);
    await signOut();
  }, 60_000);

  it('activity: activity recorded via gen2 can be read via gen1', async () => {
    configureAmplify(gen2Config);
    await signIn({ username, password });

    const currentUser = await getCurrentUser();
    await generateClient({ authMode: 'apiKey' }).graphql({
      query: createTopic,
      variables: { input: { content: `tech:Activity G2toG1 ${Date.now()}`, createdByUserId: currentUser.userId } },
    });

    // Poll until the activity appears (stream trigger is async)
    let activities: any[] = [];
    for (let attempt = 0; attempt < 10; attempt++) {
      const result = await generateClient({ authMode: 'apiKey' }).graphql({
        query: fetchUserActivity,
        variables: { userId: currentUser.userId },
      });
      activities = (result as any).data.fetchUserActivity || [];
      if (activities.length > 0) break;
      await new Promise((r) => setTimeout(r, 2000));
    }
    await signOut();

    // Read the same activity via gen1
    configureAmplify(gen1Config);
    await signIn({ username, password });

    const gen1Result = await generateClient({ authMode: 'apiKey' }).graphql({
      query: fetchUserActivity,
      variables: { userId: currentUser.userId },
    });
    const gen1Activities = (gen1Result as any).data.fetchUserActivity || [];

    expect(gen1Activities.length).toBeGreaterThan(0);
    expect(gen1Activities[0].userId).toBe(currentUser.userId);
    await signOut();
  }, 60_000);

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
