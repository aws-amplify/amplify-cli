/* eslint-disable @typescript-eslint/no-explicit-any */
import { generateClient } from 'aws-amplify/api';
import { signIn, signOut } from 'aws-amplify/auth';
import { record, flushEvents } from 'aws-amplify/analytics/kinesis';
import { getKinesisEvents } from '../src/graphql/queries';
import { KINESIS_STREAM_NAME } from '../src/constants';
import { signUp, configureAmplify } from './signup';

const auth = () => generateClient({ authMode: 'userPool' });
const pub = () => generateClient({ authMode: 'apiKey' });

const listKinesisEventCounts = /* GraphQL */ `
  query ListKinesisEventCounts($filter: ModelKinesisEventCountFilterInput, $limit: Int) {
    listKinesisEventCounts(filter: $filter, limit: $limit) {
      items {
        id
        processedAt
      }
    }
  }
`;

beforeAll(async () => {
  const config = configureAmplify();
  const creds = await signUp(config);
  await signIn({ username: creds.username, password: creds.password });
}, 60_000);

afterAll(async () => {
  await signOut();
});

describe('analytics', () => {
  it('records events to Kinesis and reads them back', async () => {
    const marker = `test-${Date.now()}`;

    for (let i = 0; i < 5; i++) {
      record({
        data: { event: 'analyticsTest', marker, index: i },
        partitionKey: 'test',
        streamName: KINESIS_STREAM_NAME,
      });
    }

    flushEvents();

    // Give Kinesis a moment to make the records available
    await new Promise((r) => setTimeout(r, 3000));

    // Poll until at least one event appears (Lambda reads from TRIM_HORIZON)
    let events: any[] = [];
    for (let attempt = 0; attempt < 10; attempt++) {
      const result = await auth().graphql({ query: getKinesisEvents });
      const raw = (result as any).data.getKinesisEvents;
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      events = parsed?.events ?? [];
      if (events.length > 0) break;
      await new Promise((r) => setTimeout(r, 3000));
    }

    expect(events.length).toBeGreaterThan(0);
  }, 120_000);

  it('trigger fires and logs events when records are put into the stream', async () => {
    const beforeResult = await pub().graphql({
      query: listKinesisEventCounts,
      variables: {
        filter: { processedAt: { attributeExists: true } },
        limit: 10000,
      },
    });
    const initialCount = (beforeResult as any).data.listKinesisEventCounts.items.length;

    for (let i = 0; i < 5; i++) {
      record({
        data: { event: 'triggerTest', timestamp: Date.now(), index: i },
        partitionKey: 'trigger-test',
        streamName: KINESIS_STREAM_NAME,
      });
    }
    flushEvents();

    let currentCount = initialCount;
    for (let attempt = 0; attempt < 10; attempt++) {
      await new Promise((r) => setTimeout(r, 3000));
      const result = await pub().graphql({
        query: listKinesisEventCounts,
        variables: {
          filter: { processedAt: { attributeExists: true } },
          limit: 10000,
        },
      });
      currentCount = (result as any).data.listKinesisEventCounts.items.length;
      if (currentCount > initialCount) break;
    }

    expect(currentCount).toBeGreaterThan(initialCount);
  }, 120_000);
});
