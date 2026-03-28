// test-utils.ts
/**
 * Shared test utilities for Store Locator Gen1 and Gen2 test scripts.
 */

import { Amplify } from 'aws-amplify';
import { Geo } from '@aws-amplify/geo';
import { TestRunner } from '../_test-common/test-apps-test-utils';
import amplifyconfig from './src/amplifyconfiguration.json';

// Configure Amplify in this module to ensure geo singletons see the config
Amplify.configure(amplifyconfig);

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

// ============================================================
// Shared Test Functions Factory
// ============================================================

export function createTestFunctions() {
  let testGeofenceId = `test-geofence-${Date.now()}`;

  // ============================================================
  // Location Search Test Functions (Place Index)
  // ============================================================

  async function testSearchByText(): Promise<void> {
    console.log('\n🔍 Testing Geo.searchByText...');
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
    console.log('\n📍 Testing Geo.searchByCoordinates...');
    console.log(`   Coordinates: [${MIDTOWN_COORDINATES[0]}, ${MIDTOWN_COORDINATES[1]}]`);
    const result = await Geo.searchByCoordinates(MIDTOWN_COORDINATES);
    if (!result) {
      throw new Error('searchByCoordinates returned no result');
    }
    const label = (result as any).label || '(no label)';
    console.log(`✅ Reverse geocode result: ${label}`);
  }

  // ============================================================
  // Geofence Test Functions (Geofence Collection)
  // ============================================================

  async function testSaveGeofences(): Promise<string> {
    console.log('\n📐 Testing Geo.saveGeofences...');
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

  async function testGetGeofence(): Promise<void> {
    console.log(`\n🔎 Testing Geo.getGeofence (id: ${testGeofenceId})...`);
    const geofence = await Geo.getGeofence(testGeofenceId);
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

  async function testListGeofences(): Promise<void> {
    console.log('\n📋 Testing Geo.listGeofences...');
    const result = await Geo.listGeofences();
    const entries = (result as any).entries || [];
    console.log(`✅ Found ${entries.length} geofence(s):`);
    entries.forEach((g: any) => {
      console.log(`   - ${g.geofenceId} (created: ${g.createTime})`);
    });
    const found = entries.some((g: any) => g.geofenceId === testGeofenceId);
    if (!found) {
      throw new Error(`Test geofence ${testGeofenceId} not found in list`);
    }
    console.log(`   ✅ Test geofence ${testGeofenceId} found in list`);
  }

  async function testDeleteGeofences(): Promise<void> {
    console.log(`\n🗑️ Testing Geo.deleteGeofences (id: ${testGeofenceId})...`);
    const result = await Geo.deleteGeofences([testGeofenceId]);
    const errors = (result as any).errors || [];
    if (errors.length > 0) {
      throw new Error(`deleteGeofences had errors: ${JSON.stringify(errors)}`);
    }
    console.log('✅ Geofence deleted successfully');
  }

  return {
    testSearchByText,
    testSearchByCoordinates,
    testSaveGeofences,
    testGetGeofence,
    testListGeofences,
    testDeleteGeofences,
  };
}

// ============================================================
// Shared Test Orchestration Functions
// ============================================================

export function createTestOrchestrator(testFunctions: ReturnType<typeof createTestFunctions>, runner: TestRunner) {
  async function runSearchTests(): Promise<void> {
    console.log('\n' + '='.repeat(50));
    console.log('🔍 PART 1: Location Search (Place Index)');
    console.log('='.repeat(50));

    await runner.runTest('searchByText', testFunctions.testSearchByText);
    await runner.runTest('searchByCoordinates', testFunctions.testSearchByCoordinates);
  }

  async function runGeofenceTests(): Promise<void> {
    console.log('\n' + '='.repeat(50));
    console.log('📐 PART 2: Geofence Operations');
    console.log('='.repeat(50));

    const geofenceId = await runner.runTest('saveGeofences', testFunctions.testSaveGeofences);
    if (geofenceId) {
      await runner.runTest('getGeofence', testFunctions.testGetGeofence);
      await runner.runTest('listGeofences', testFunctions.testListGeofences);
      await runner.runTest('deleteGeofences', testFunctions.testDeleteGeofences);
    }
  }

  return {
    runSearchTests,
    runGeofenceTests,
  };
}
