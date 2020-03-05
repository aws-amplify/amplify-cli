import * as nexpect from 'nexpect';
import * as util from '../util';

export function headlessPull(projectRootDirPath, amplifyParam, providersParam): Promise<void> {
  return new Promise((resolve, reject) => {
    nexpect
      .spawn(
        util.getCLIPath(),
        ['pull', '--amplify', JSON.stringify(amplifyParam), '--providers', JSON.stringify(providersParam), '--no-override', '--yes'],
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
