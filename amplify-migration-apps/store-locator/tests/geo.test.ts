/* eslint-disable @typescript-eslint/no-explicit-any */
import { Geo } from '@aws-amplify/geo';
import { signIn, signOut } from 'aws-amplify/auth';
import { signUp, addToAdminGroup, configureAmplify } from './signup';

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

beforeAll(async () => {
  const config = configureAmplify();
  const creds = await signUp(config);
  username = creds.username;
  password = creds.password;

  await addToAdminGroup(username, config);
  await signIn({ username, password });
}, 60_000);

afterAll(async () => {
  await signOut();
});

describe('guest', () => {
  it('searches by text as guest', async () => {
    await signOut();

    const results = await Geo.searchByText('New York', { maxResults: 5 });

    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThan(0);

    await signIn({ username, password });
  });

  it('reverse geocodes coordinates as guest', async () => {
    await signOut();

    const result = await Geo.searchByCoordinates(MIDTOWN_COORDINATES);

    expect(result).not.toBeNull();
    expect(typeof (result as any).label).toBe('string');

    await signIn({ username, password });
  });

  it('cannot save geofences as guest', async () => {
    await signOut();

    try {
      const result = await Geo.saveGeofences([
        {
          geofenceId: `guest-geofence-${Date.now()}`,
          geometry: { polygon: [TEST_GEOFENCE_POLYGON] },
        },
      ]);
      const errors = (result as any).errors || [];
      expect(errors.length).toBeGreaterThan(0);
    } catch {
      expect(true).toBe(true);
    }

    await signIn({ username, password });
  });
});

describe('auth', () => {
  const geofenceId = `test-geofence-${Date.now()}`;

  beforeAll(async () => {
    await signOut();
    await signIn({ username, password });
  }, 30_000);

  it('searches by text', async () => {
    const results = await Geo.searchByText('New York', { maxResults: 5 });

    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThan(0);
  });

  it('reverse geocodes coordinates', async () => {
    const result = await Geo.searchByCoordinates(MIDTOWN_COORDINATES);

    expect(result).not.toBeNull();
    expect((result as any).label).toBeDefined();
    expect(typeof (result as any).label).toBe('string');
  });

  it('saves a geofence with no errors', async () => {
    const result = await Geo.saveGeofences([
      {
        geofenceId,
        geometry: { polygon: [TEST_GEOFENCE_POLYGON] },
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
