import * as util from '../util';
import { nspawn as spawn } from 'amplify-e2e-core';

export function headlessInit(projectRootDirPath, amplifyParam, providersParam, codegenParam): Promise<void> {
  return new Promise((resolve, reject) => {
    spawn(
      util.getCLIPath(),
      [
        'init',
        '--amplify',
        JSON.stringify(amplifyParam),
        '--providers',
        JSON.stringify(providersParam),
        '--codegen',
        JSON.stringify(codegenParam),
        '--yes',
      ],
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
