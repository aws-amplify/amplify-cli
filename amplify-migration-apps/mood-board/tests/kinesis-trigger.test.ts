/* eslint-disable @typescript-eslint/no-explicit-any */
import { generateClient } from 'aws-amplify/api';
import { signIn, signOut } from 'aws-amplify/auth';
import { record, flushEvents } from 'aws-amplify/analytics/kinesis';
import { KINESIS_STREAM_NAME } from '../src/constants';
import { signUp, configureAmplify } from './signup';

const listKinesisEventCounts = /* GraphQL */ `query ListKinesisEventCounts($filter: ModelKinesisEventCountFilterInput, $limit: Int) {
  listKinesisEventCounts(filter: $filter, limit: $limit) {
    items {
      id
      processedAt
    }
  }
}`;

const pub = () => generateClient({ authMode: 'apiKey' });

beforeAll(async () => {
  const config = configureAmplify();
  const creds = await signUp(config);
  await signIn({ username: creds.username, password: creds.password });
}, 60_000);

afterAll(async () => {
  await signOut();
});

describe('kinesis trigger', () => {
  it('trigger fires and logs events when records are put into the stream', async () => {
    // Get initial count (filter to entries with processedAt to skip stale data)
    const beforeResult = await pub().graphql({
      query: listKinesisEventCounts,
      variables: {
        filter: { processedAt: { attributeExists: true } },
        limit: 1000,
      },
    });
    const initialCount = (beforeResult as any).data.listKinesisEventCounts.items.length;

    // Record events to the Kinesis stream
    for (let i = 0; i < 100; i++) {
      record({
        data: { event: 'triggerTest', timestamp: Date.now(), index: i },
        partitionKey: 'trigger-test',
        streamName: KINESIS_STREAM_NAME,
      });
    }

    flushEvents();

    // Poll until new entries appear
    let currentCount = initialCount;
    for (let attempt = 0; attempt < 20; attempt++) {
      await new Promise((r) => setTimeout(r, 5000));
      const result = await pub().graphql({
        query: listKinesisEventCounts,
        variables: {
          filter: { processedAt: { attributeExists: true } },
          limit: 1000,
        },
      });
      currentCount = (result as any).data.listKinesisEventCounts.items.length;
      if (currentCount > initialCount) break;
    }

    expect(currentCount).toBeGreaterThan(initialCount);
  }, 180_000);
});
