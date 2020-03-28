import * as util from '../util';
import { nspawn as spawn } from 'amplify-e2e-core';

export function headlessPull(projectRootDirPath, amplifyParam, providersParam): Promise<void> {
  return new Promise((resolve, reject) => {
    spawn(
      util.getCLIPath(),
      ['pull', '--amplify', JSON.stringify(amplifyParam), '--providers', JSON.stringify(providersParam), '--no-override', '--yes'],
      { cwd: projectRootDirPath, stripColors: true },
    ).run((err: Error) => {
      if (!err) {
        resolve();
      } else {
        reject(err);
      }
    });
  });
}
