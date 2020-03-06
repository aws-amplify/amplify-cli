import * as util from '../util';
import * as nexpect from 'nexpect';

export function headlessDelete(projectRootDirPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    nexpect
      .spawn(util.getCLIPath(), ['delete'], { cwd: projectRootDirPath, stripColors: true, verbose: true })
      .wait('Are you sure you want to continue?')
      .sendline('y')
      .sendline('')
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
