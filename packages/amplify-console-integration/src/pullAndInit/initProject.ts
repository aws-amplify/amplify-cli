import * as util from '../util';
import * as nexpect from 'nexpect';

export function headlessInit(projectRootDirPath, amplifyParam, providersParam, codegenParam): Promise<void> {
  return new Promise((resolve, reject) => {
    nexpect
      .spawn(
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
        { cwd: projectRootDirPath, stripColors: true, verbose: true },
      )
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}
