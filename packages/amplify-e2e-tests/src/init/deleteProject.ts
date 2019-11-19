import * as nexpect from 'nexpect';
import { getCLIPath, isCI } from '../utils';

export default function deleteProject(cwd: string, deleteDeploymentBucket: Boolean = true, verbose: Boolean = isCI() ? false : true) {
  return new Promise((resolve, reject) => {
    nexpect
      .spawn(getCLIPath(), ['delete'], { cwd, stripColors: true, verbose })
      .wait('Are you sure you want to continue?')
      .sendline('y')
      .sendline('')
      .wait('Project deleted locally.')
      .run(async function(err: Error) {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}
