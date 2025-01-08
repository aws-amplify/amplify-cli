import { getCLIPath, nspawn as spawn } from '@aws-amplify/amplify-e2e-core';

export function versionCheck(cwd: string, testingWithLatestCodebase = false, version: { v?: string } = {}): Promise<void> {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(testingWithLatestCodebase), ['-v'], { cwd, stripColors: true })
      .wait(/\d+\.\d+\.\d+/, (v) => (version.v = v.trim()))
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}

/**
 * Validates from and to versions for migration tests.
 */
export const validateVersionsForMigrationTest = async (): Promise<void> => {
  const migrateFromVersion = { v: 'uninitialized' };
  const migrateToVersion = { v: 'uninitialized' };
  await versionCheck(process.cwd(), false, migrateFromVersion);
  await versionCheck(process.cwd(), true, migrateToVersion);
  console.log(`Test migration from: ${migrateFromVersion.v} to ${migrateToVersion.v}`);
  expect(migrateFromVersion.v).not.toEqual(migrateToVersion.v);
  expect(allowedVersionsToMigrateFrom).toContain(migrateFromVersion.v);
};

/**
 * This list is used to check migration tests with the following changes. (excludes layer migration tests)
 *
 * api add/update flow: https://github.com/aws-amplify/amplify-cli/pull/8287
 *
 * ext migrate flow: https://github.com/aws-amplify/amplify-cli/pull/8806
 */
export const allowedVersionsToMigrateFrom = ['12.10.1'];
