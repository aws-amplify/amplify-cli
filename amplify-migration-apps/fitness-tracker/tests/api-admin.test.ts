/* eslint-disable @typescript-eslint/no-explicit-any */
import { signIn, signOut } from 'aws-amplify/auth';
import { get } from 'aws-amplify/api';
import { ADMIN_API_NAME } from '../src/api-config';
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
  it('GET /admin/users returns a user list with count', async () => {
    const restOperation = get({
      apiName: ADMIN_API_NAME,
      path: '/admin/users',
    });

    const { body } = await restOperation.response;
    const response = (await body.json()) as any;

    expect(response).toBeDefined();
    expect(typeof response.count).toBe('number');
    expect(response.count).toBeGreaterThanOrEqual(1);
  });
});
