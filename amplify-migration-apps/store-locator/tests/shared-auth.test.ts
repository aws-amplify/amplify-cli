/**
 * Validates that the Cognito user pool is shared between gen1 and gen2 configurations.
 * Tests both directions: gen1→gen2 and gen2→gen1.
 *
 * Note: Geo resources (search, map) are stateless and geofences are not supported
 * post-refactor, so only auth sharing is validated here.
 */
import { getCurrentUser, signIn, signOut } from 'aws-amplify/auth';
import { signUp, configureAmplify } from './signup';
import * as fs from 'fs';

const gen1Config = JSON.parse(fs.readFileSync('src/amplifyconfiguration.json', { encoding: 'utf-8' }));
const gen2Config = JSON.parse(fs.readFileSync('amplify_outputs.json', { encoding: 'utf-8' }));

it('auth: user created via gen1 can sign in via gen2', async () => {
  configureAmplify(gen1Config);
  const creds = await signUp(gen1Config);
  await signIn({ username: creds.username, password: creds.password });
  const gen1User = await getCurrentUser();
  await signOut();

  configureAmplify(gen2Config);
  await signIn({ username: creds.username, password: creds.password });
  const gen2User = await getCurrentUser();
  await signOut();

  expect(gen2User.userId).toBe(gen1User.userId);
}, 60_000);

it('auth: user created via gen2 can sign in via gen1', async () => {
  configureAmplify(gen2Config);
  const creds = await signUp(gen2Config);
  await signIn({ username: creds.username, password: creds.password });
  const gen2User = await getCurrentUser();
  await signOut();

  configureAmplify(gen1Config);
  await signIn({ username: creds.username, password: creds.password });
  const gen1User = await getCurrentUser();
  await signOut();

  expect(gen1User.userId).toBe(gen2User.userId);
}, 60_000);
