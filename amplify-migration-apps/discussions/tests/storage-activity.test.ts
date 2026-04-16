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
    // The topic created in the previous test should have triggered:
    // model stream → recorduseractivity → activity table insert → activityTrigger → counter increment
    // Poll until the counter is > 0
    let count = 0;
    for (let attempt = 0; attempt < 15; attempt++) {
      const result = await client().graphql({ query: getActivityStats });
      count = (result as any).data.getActivityStats?.activityCount ?? 0;
      if (count > 0) break;
      await new Promise((r) => setTimeout(r, 2000));
    }

    expect(count).toBeGreaterThan(0);
  }, 45_000);
});
