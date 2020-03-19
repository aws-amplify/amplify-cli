import { nspawn as spawn } from 'amplify-e2e-core';
import { getCLIPath } from '../utils';

export function deleteProject(cwd: string, deleteDeploymentBucket: Boolean = true) {
  return new Promise((resolve, reject) => {
    const noOutputTimeout = 10 * 60 * 1000; // 10 minutes
    spawn(getCLIPath(), ['delete'], { cwd, stripColors: true, noOutputTimeout })
      .wait('Are you sure you want to continue?')
      .sendLine('y')
      .sendCarriageReturn()
      .wait('Project deleted locally.')
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}
