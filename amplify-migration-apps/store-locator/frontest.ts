/* eslint-disable @typescript-eslint/no-explicit-any */
import { Amplify } from 'aws-amplify';
import { Geo } from '@aws-amplify/geo';
import { signIn, signOut, getCurrentUser } from 'aws-amplify/auth';
import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  AdminAddUserToGroupCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import * as fs from 'fs';
import { randomBytes } from 'crypto';

// Polyfill crypto for Node.js environment (required for Amplify Auth)
import { webcrypto } from 'crypto';
if (typeof globalThis.crypto === 'undefined') {
  (globalThis as any).crypto = webcrypto;
}

// Midtown Manhattan store coordinates from App.tsx
const MIDTOWN_COORDINATES: [number, number] = [-73.9857, 40.7484];

// Counter-clockwise rectangle around Midtown Manhattan (~0.01 deg offset)
const TEST_GEOFENCE_POLYGON: [number, number][] = [
  [-73.995, 40.745],
  [-73.975, 40.745],
  [-73.975, 40.755],
  [-73.995, 40.755],
  [-73.995, 40.745],
];


async function main(): Promise<void> {
  const [configPath] = process.argv.slice(2);
  const config = JSON.parse(fs.readFileSync(configPath, { encoding: 'utf-8' }));

  Amplify.configure(config);

  const { username, password } = await signUp(config);

  // AdminCreateUser does not fire the PostConfirmation trigger, so
  // manually add the user to storeLocatorAdmin for geofence permissions.
  const gen2Auth = (config as any)?.auth;
  const userPoolId = config.aws_user_pools_id ?? gen2Auth?.user_pool_id;
  const region = config.aws_cognito_region ?? gen2Auth?.aws_region;

  const cognitoClient = new CognitoIdentityProviderClient({ region });
  await cognitoClient.send(
    new AdminAddUserToGroupCommand({
      UserPoolId: userPoolId,
      Username: username,
      GroupName: 'storeLocatorAdmin',
    }),
  );
  console.log('✅ Added user to storeLocatorAdmin group');

  await signIn({ username, password });
  const currentUser = await getCurrentUser();
  console.log(`✅ Signed in as: ${currentUser.username}`);

  console.log('');
  console.log('='.repeat(60));
  console.log('🔍 Location Search (Place Index)');
  console.log('='.repeat(60));
  console.log('');

  await testSearchByText();
  await testSearchByCoordinates();

  console.log('');
  console.log('='.repeat(60));
  console.log('📐 Geofence Operations');
  console.log('='.repeat(60));
  console.log('');

  const geofenceId = await testSaveGeofences();
  await testGetGeofence(geofenceId);
  await testListGeofences(geofenceId);
  await testDeleteGeofences(geofenceId);

  await signOut();
}

main().catch((error) => {
  console.error('Fatal error:', error.message);
  process.exit(1);
});


// ============================================================
// Location Search Tests (Place Index)
// ============================================================

async function testSearchByText(): Promise<void> {
  console.log('🔍 Testing Geo.searchByText...');
  const results = await Geo.searchByText('New York', {
    maxResults: 5,
  });
  if (!results || results.length === 0) {
    throw new Error('searchByText returned no results');
  }
  console.log(`✅ Found ${results.length} results:`);
  results.forEach((r: any) => {
    const label = r.label || '(no label)';
    const point = r.geometry?.point;
    console.log(`   - ${label}${point ? ` [${point[0].toFixed(4)}, ${point[1].toFixed(4)}]` : ''}`);
  });
}

async function testSearchByCoordinates(): Promise<void> {
  console.log('📍 Testing Geo.searchByCoordinates...');
  console.log(`   Coordinates: [${MIDTOWN_COORDINATES[0]}, ${MIDTOWN_COORDINATES[1]}]`);
  const result = await Geo.searchByCoordinates(MIDTOWN_COORDINATES);
  if (!result) {
    throw new Error('searchByCoordinates returned no result');
  }
  const label = (result as any).label || '(no label)';
  console.log(`✅ Reverse geocode result: ${label}`);
}


// ============================================================
// Geofence Tests
// ============================================================

async function testSaveGeofences(): Promise<string> {
  const testGeofenceId = `test-geofence-${Date.now()}`;
  console.log('📐 Testing Geo.saveGeofences...');
  console.log(`   Geofence ID: ${testGeofenceId}`);
  const result = await Geo.saveGeofences([
    {
      geofenceId: testGeofenceId,
      geometry: {
        polygon: [TEST_GEOFENCE_POLYGON],
      },
    },
  ]);
  const successes = (result as any).successes || [];
  const errors = (result as any).errors || [];
  if (errors.length > 0) {
    throw new Error(`saveGeofences had errors: ${JSON.stringify(errors)}`);
  }
  if (successes.length === 0) {
    throw new Error('saveGeofences returned no successes');
  }
  console.log('✅ Geofence saved:', {
    geofenceId: successes[0].geofenceId,
    createTime: successes[0].createTime,
  });
  return testGeofenceId;
}

async function testGetGeofence(geofenceId: string): Promise<void> {
  console.log(`🔎 Testing Geo.getGeofence (id: ${geofenceId})...`);
  const geofence = await Geo.getGeofence(geofenceId);
  if (!geofence) {
    throw new Error('getGeofence returned no result');
  }
  const gf = geofence as any;
  console.log('✅ Geofence retrieved:', {
    geofenceId: gf.geofenceId,
    createTime: gf.createTime,
    updateTime: gf.updateTime,
    vertices: gf.geometry?.polygon?.[0]?.length || 0,
  });
}

async function testListGeofences(geofenceId: string): Promise<void> {
  console.log('📋 Testing Geo.listGeofences...');
  const result = await Geo.listGeofences();
  const entries = (result as any).entries || [];
  console.log(`✅ Found ${entries.length} geofence(s):`);
  entries.forEach((g: any) => {
    console.log(`   - ${g.geofenceId} (created: ${g.createTime})`);
  });
  const found = entries.some((g: any) => g.geofenceId === geofenceId);
  if (!found) {
    throw new Error(`Test geofence ${geofenceId} not found in list`);
  }
  console.log(`   ✅ Test geofence ${geofenceId} found in list`);
}

async function testDeleteGeofences(geofenceId: string): Promise<void> {
  console.log(`🗑️ Testing Geo.deleteGeofences (id: ${geofenceId})...`);
  const result = await Geo.deleteGeofences([geofenceId]);
  const errors = (result as any).errors || [];
  if (errors.length > 0) {
    throw new Error(`deleteGeofences had errors: ${JSON.stringify(errors)}`);
  }
  console.log('✅ Geofence deleted successfully');
}


// ============================================================
// User Provisioning
// ============================================================

async function signUp(config: any): Promise<{ username: string; password: string }> {
  const gen2Auth = (config as any)?.auth;
  const userPoolId = config.aws_user_pools_id ?? gen2Auth?.user_pool_id;
  const region = config.aws_cognito_region ?? gen2Auth?.aws_region;

  // Store locator uses email-based auth
  const username = generateTestEmail();
  const password = generateTestPassword();

  const cognitoClient = new CognitoIdentityProviderClient({ region });

  await cognitoClient.send(new AdminCreateUserCommand({
    UserPoolId: userPoolId,
    Username: username,
    TemporaryPassword: password,
    UserAttributes: [
      { Name: 'email', Value: username },
      { Name: 'email_verified', Value: 'true' },
    ],
    MessageAction: 'SUPPRESS',
  }));

  await cognitoClient.send(new AdminSetUserPasswordCommand({
    UserPoolId: userPoolId,
    Username: username,
    Password: password,
    Permanent: true,
  }));

  return { username, password };
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
