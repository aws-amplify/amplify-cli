import { getCLIPath, nspawn as spawn } from 'amplify-e2e-core';

export function versionCheck(cwd: string, testingWithLatestCodebase = false) {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(testingWithLatestCodebase), ['-v'], { cwd, stripColors: true }).run((err: Error) => {
      if (!err) {
        resolve();
      } else {
        reject(err);
      }
    });
  });
}
