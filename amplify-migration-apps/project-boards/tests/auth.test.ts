import { signIn, signOut, fetchAuthSession } from 'aws-amplify/auth';
import { signUp, config } from './signup';

describe('PreTokenGeneration trigger', () => {
  it('injects custom claims into the ID token', async () => {
    const creds = await signUp(config);
    await signIn({ username: creds.username, password: creds.password });

    const session = await fetchAuthSession();
    const idToken = session.tokens?.idToken;
    expect(idToken).toBeDefined();

    const payload = idToken!.payload;
    expect(payload['attribute_key1']).toBe('attribute_value1');
    expect(payload['attribute_key2']).toBe('attribute_value2');

    await signOut();
  }, 60_000);
});
