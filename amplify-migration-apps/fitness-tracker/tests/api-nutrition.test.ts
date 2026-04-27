/* eslint-disable @typescript-eslint/no-explicit-any */
import { getCurrentUser, signIn, signOut } from 'aws-amplify/auth';
import { post } from 'aws-amplify/api';
import { NUTRITION_API_NAME } from '../src/api-config';
import { signUp, configureAmplify } from './signup';

beforeAll(async () => {
  const config = configureAmplify();
  const creds = await signUp(config);
  await signIn({ username: creds.username, password: creds.password });
}, 60_000);

afterAll(async () => {
  await signOut();
});

describe('auth', () => {
  it('POST /nutrition/log returns a success message', async () => {
    const currentUser = await getCurrentUser();

    const restOperation = post({
      apiName: NUTRITION_API_NAME,
      path: '/nutrition/log',
      options: {
        body: { userName: currentUser.username, content: `Jest nutrition log - ${Date.now()}` },
      },
    });

    const { body } = await restOperation.response;
    const response = (await body.json()) as any;

    expect(response).toBeDefined();
    expect(typeof response.message).toBe('string');
    expect(response.message.length).toBeGreaterThan(0);
  });
});
