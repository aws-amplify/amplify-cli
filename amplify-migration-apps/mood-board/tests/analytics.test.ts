/* eslint-disable @typescript-eslint/no-explicit-any */
import { generateClient } from 'aws-amplify/api';
import { signIn, signOut } from 'aws-amplify/auth';
import { record } from 'aws-amplify/analytics/kinesis';
import { getKinesisEvents } from '../src/graphql/queries';
import { KINESIS_STREAM_NAME } from '../src/constants';
import { signUp, config } from './signup';

const auth = () => generateClient({ authMode: 'userPool' });

beforeAll(async () => {
  const creds = await signUp(config);
  await signIn({ username: creds.username, password: creds.password });
}, 60_000);

afterAll(async () => {
  await signOut();
});

describe('auth', () => {
  it('getKinesisEvents returns parseable JSON', async () => {
    const result = await auth().graphql({ query: getKinesisEvents });
    const raw = (result as any).data.getKinesisEvents;

    expect(typeof raw).toBe('string');
    const parsed = JSON.parse(raw);
    expect(parsed).toBeDefined();
    expect(typeof parsed).toBe('object');
  });

  it('records an event and reads it back from the stream', async () => {
    const eventData = {
      event: 'surpriseMeClicked',
      timestamp: Date.now(),
      source: 'jest',
    };

    record({
      data: eventData,
      partitionKey: 'surpriseMe',
      streamName: KINESIS_STREAM_NAME,
    });

    // Poll until the event appears (Kinesis has ingestion delay)
    let events: any[] = [];
    for (let attempt = 0; attempt < 10; attempt++) {
      const result = await auth().graphql({ query: getKinesisEvents });
      const raw = (result as any).data.getKinesisEvents;
      const parsed = JSON.parse(raw);
      events = parsed.events || [];
      if (events.length > 0) break;
      await new Promise((r) => setTimeout(r, 3000));
    }

    expect(events.length).toBeGreaterThan(0);
  }, 45_000);
});
