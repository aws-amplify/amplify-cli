import { getCLIPath, nspawn as spawn } from 'amplify-e2e-core';

export function versionCheck(cwd: string, testingWithLatestCodebase = false, version: { v?: string } = {}): Promise<void> {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(testingWithLatestCodebase), ['-v'], { cwd, stripColors: true })
      .wait(/\d+\.\d+\.\d+/, v => (version.v = v.trim()))
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
 * This list is used to check migration tests with the following changes. (excludes layer migration tests)
 *
 * api add/update flow: https://github.com/aws-amplify/amplify-cli/pull/8287
 *
 * ext migrate flow: https://github.com/aws-amplify/amplify-cli/pull/8806
 */
export const allowedVersionsToMigrateFrom = ['5.2.0', '6.1.0'];
