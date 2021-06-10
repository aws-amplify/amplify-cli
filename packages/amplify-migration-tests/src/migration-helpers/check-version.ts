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
