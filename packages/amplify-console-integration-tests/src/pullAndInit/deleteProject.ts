import * as util from '../util';
import { nspawn as spawn } from 'amplify-e2e-core';

export function headlessDelete(projectRootDirPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    spawn(util.getCLIPath(), ['delete'], { cwd: projectRootDirPath, stripColors: true })
      .wait('Are you sure you want to continue?')
      .sendLine('y')
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
