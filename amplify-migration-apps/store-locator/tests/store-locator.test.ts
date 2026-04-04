/* eslint-disable @typescript-eslint/no-explicit-any */
import { Amplify } from 'aws-amplify';
import { Geo } from '@aws-amplify/geo';
import { signIn, signOut } from 'aws-amplify/auth';
import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  AdminAddUserToGroupCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import * as fs from 'fs';
import { randomBytes } from 'crypto';

import { webcrypto } from 'crypto';
if (typeof globalThis.crypto === 'undefined') {
  (globalThis as any).crypto = webcrypto;
}

const CONFIG_PATH = process.env.APP_CONFIG_PATH;
if (!CONFIG_PATH) {
  throw new Error('APP_CONFIG_PATH environment variable is required');
}
const config = JSON.parse(fs.readFileSync(CONFIG_PATH, { encoding: 'utf-8' }));
Amplify.configure(config);

const MIDTOWN_COORDINATES: [number, number] = [-73.9857, 40.7484];

const TEST_GEOFENCE_POLYGON: [number, number][] = [
  [-73.995, 40.745],
  [-73.975, 40.745],
  [-73.975, 40.755],
  [-73.995, 40.755],
  [-73.995, 40.745],
];

let username: string;
let password: string;

async function signUp(cfg: any): Promise<{ username: string; password: string }> {
  const gen2Auth = (cfg as any)?.auth;
  const userPoolId = cfg.aws_user_pools_id ?? gen2Auth?.user_pool_id;
  const region = cfg.aws_cognito_region ?? gen2Auth?.aws_region;

  const uname = generateTestEmail();
  const pwd = generateTestPassword();

  const cognitoClient = new CognitoIdentityProviderClient({ region });

  await cognitoClient.send(new AdminCreateUserCommand({
    UserPoolId: userPoolId,
    Username: uname,
    TemporaryPassword: pwd,
    UserAttributes: [
      { Name: 'email', Value: uname },
      { Name: 'email_verified', Value: 'true' },
    ],
    MessageAction: 'SUPPRESS',
  }));

  await cognitoClient.send(new AdminSetUserPasswordCommand({
    UserPoolId: userPoolId,
    Username: uname,
    Password: pwd,
    Permanent: true,
  }));

  return { username: uname, password: pwd };
}

function generateTestPassword(): string {
  return `Test${randomSuffix()}!Aa1`;
}

function generateTestEmail(): string {
  return `testuser-${randomSuffix()}@test.example.com`;
}

function randomSuffix(): string {
  return randomBytes(4).toString('hex');
}

beforeAll(async () => {
  const creds = await signUp(config);
  username = creds.username;
  password = creds.password;

  const gen2Auth = (config as any)?.auth;
  const userPoolId = config.aws_user_pools_id ?? gen2Auth?.user_pool_id;
  const region = config.aws_cognito_region ?? gen2Auth?.aws_region;

  const cognitoClient = new CognitoIdentityProviderClient({ region });
  await cognitoClient.send(new AdminAddUserToGroupCommand({
    UserPoolId: userPoolId,
    Username: username,
    GroupName: 'storeLocatorAdmin',
  }));

  await signIn({ username, password });
}, 60_000);

afterAll(async () => {
  await signOut();
});

describe('Location Search', () => {
  it('searches by text and returns results', async () => {
    const results = await Geo.searchByText('New York', { maxResults: 5 });

    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThan(0);
  });

  it('reverse geocodes coordinates and returns a label', async () => {
    const result = await Geo.searchByCoordinates(MIDTOWN_COORDINATES);

    expect(result).not.toBeNull();
    expect((result as any).label).toBeDefined();
    expect(typeof (result as any).label).toBe('string');
  });
});

describe('Geofence Operations', () => {
  const geofenceId = `test-geofence-${Date.now()}`;

  it('saves a geofence with no errors', async () => {
    const result = await Geo.saveGeofences([
      {
        geofenceId,
        geometry: {
          polygon: [TEST_GEOFENCE_POLYGON],
        },
      },
    ]);
    const successes = (result as any).successes || [];
    const errors = (result as any).errors || [];

    expect(errors.length).toBe(0);
    expect(successes.length).toBeGreaterThan(0);
  });

  it('gets the saved geofence by id', async () => {
    const geofence = await Geo.getGeofence(geofenceId);

    expect(geofence).toBeDefined();
    expect((geofence as any).geofenceId).toBe(geofenceId);
  });

  it('lists geofences including the saved one', async () => {
    const result = await Geo.listGeofences();
    const entries = (result as any).entries || [];

    expect(Array.isArray(entries)).toBe(true);
    const found = entries.some((g: any) => g.geofenceId === geofenceId);
    expect(found).toBe(true);
  });

  it('deletes the geofence with no errors', async () => {
    const result = await Geo.deleteGeofences([geofenceId]);
    const errors = (result as any).errors || [];

    expect(errors.length).toBe(0);
  });
});
