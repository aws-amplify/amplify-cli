import * as fs from 'fs-extra';
import { join } from 'path';

// Ensure to update packages/amplify-e2e-tests/src/cleanup-e2e-resources.ts is also updated this gets updated
export const AWS_REGIONS_TO_RUN_TESTS = [
  'us-east-1',
  'us-east-2',
  'us-west-2',
  'eu-west-2',
  'eu-central-1',
  'ap-northeast-1',
  'ap-southeast-1',
  'ap-southeast-2',
];

// Some services (eg. amazon lex) are not available in all regions
// Tests added to this list will always run in a specific region
export const FORCE_REGION_MAP: Map<string, string> = new Map();
FORCE_REGION_MAP.set('src/__tests__/custom-resource-with-storage.test.ts', 'us-west-2');
FORCE_REGION_MAP.set('src/__tests__/interactions.test.ts', 'us-west-2');
FORCE_REGION_MAP.set('src/__tests__/interactions-1.test.ts', 'us-west-2');
FORCE_REGION_MAP.set('src/__tests__/interactions-2.test.ts', 'us-west-2');
FORCE_REGION_MAP.set('src/__tests__/migration_tests_v10/pinpoint-region.migration.test.ts', 'us-east-2');

// some tests require additional time, the parent account can handle longer tests (up to 90 minutes)
export const USE_PARENT_ACCOUNT = [
  'src/__tests__/import_dynamodb_1.test.ts',
  'src/__tests__/import_s3_1.test.ts',
  'src/__tests__/transformer-migrations/searchable-migration.test.ts',
];

export const REPO_ROOT = join(__dirname, '..');
const TEST_TIMINGS_PATH = join(REPO_ROOT, 'scripts', 'cci-test-timings.data.json');

/**
 * CircleCI job data contains data for each job.
 *
 * The data in this file is at the JOB level.
 */
export function loadTestTimings(): { timingData: { test: string; medianRuntime: number }[] } {
  return JSON.parse(fs.readFileSync(TEST_TIMINGS_PATH, 'utf-8'));
}

/**
 * Same as getOldJobName, but excludes the suffixes like "_pkg" or "_v6", etc
 * @param testSuitePath
 * @returns
 */
export const getOldJobNameWithoutSuffixes = (testSuitePath: string): string => {
  const startIndex = testSuitePath.lastIndexOf('/') + 1;
  const endIndex = testSuitePath.lastIndexOf('.test');
  return testSuitePath.substring(startIndex, endIndex).split('.e2e').join('').split('.').join('-');
};
