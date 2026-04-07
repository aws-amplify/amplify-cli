/* eslint-disable @typescript-eslint/no-explicit-any */
import { generateClient } from 'aws-amplify/api';
import { signIn, signOut } from 'aws-amplify/auth';
import { getKinesisEvents } from '../src/graphql/queries';
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

});
