/* eslint-disable @typescript-eslint/no-explicit-any */
import { generateClient } from 'aws-amplify/api';
import { getCurrentUser, signIn, signOut } from 'aws-amplify/auth';
import { signUp, configureAmplify } from './signup';
import { fetchUserActivity, getActivityStats } from '../src/graphql/queries';
import { createTopic } from '../src/graphql/mutations';

const client = () => generateClient({ authMode: 'apiKey' });

beforeAll(async () => {
  const config = configureAmplify();
  const creds = await signUp(config);
  await signIn({ username: creds.username, password: creds.password });
}, 60_000);

afterAll(async () => {
  await signOut();
});

describe('auth', () => {
  it('records activity after creating a topic', async () => {
    const currentUser = await getCurrentUser();

    // Create a topic to trigger the recorduseractivity Lambda via DynamoDB stream
    await client().graphql({
      query: createTopic,
      variables: { input: { content: `tech:Activity Test ${Date.now()}`, createdByUserId: currentUser.userId } },
    });

    // Poll until the activity appears (stream trigger is async)
    let activities: any[] = [];
    for (let attempt = 0; attempt < 10; attempt++) {
      const result = await client().graphql({ query: fetchUserActivity, variables: { userId: currentUser.userId } });
      activities = (result as any).data.fetchUserActivity || [];
      if (activities.length > 0) break;
      await new Promise((r) => setTimeout(r, 2000));
    }

    expect(activities.length).toBeGreaterThan(0);
    expect(activities[0].userId).toBe(currentUser.userId);
    expect(typeof activities[0].activityType).toBe('string');
    expect(typeof activities[0].timestamp).toBe('string');
  }, 30_000);

  it('increments activity counter via storage DynamoDB trigger', async () => {
    // Record the current counter value
    const before = await client().graphql({ query: getActivityStats });
    const initialCount = (before as any).data.getActivityStats?.activityCount ?? 0;

    const currentUser = await getCurrentUser();

    // Create multiple topics to trigger the chain multiple times
    const topicCount = 3;
    for (let i = 0; i < topicCount; i++) {
      await client().graphql({
        query: createTopic,
        variables: { input: { content: `tech:Counter Test ${Date.now()}-${i}`, createdByUserId: currentUser.userId } },
      });
    }

    // Poll until the counter increases by at least topicCount
    let count = initialCount;
    for (let attempt = 0; attempt < 15; attempt++) {
      const result = await client().graphql({ query: getActivityStats });
      count = (result as any).data.getActivityStats?.activityCount ?? 0;
      if (count >= initialCount + topicCount) break;
      await new Promise((r) => setTimeout(r, 2000));
    }

    expect(count).toBeGreaterThanOrEqual(initialCount + topicCount);
  }, 45_000);
});
