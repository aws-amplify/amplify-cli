import * as nexpect from 'nexpect';
import { getCLIPath, isCI } from '../utils';

export default function deleteProject(cwd: string, deleteDeploymentBucket: Boolean = true, verbose: Boolean = isCI() ? false : true) {
  return new Promise((resolve, reject) => {
    const nrun = nexpect
      .spawn(getCLIPath(), deleteDeploymentBucket ? ['delete', '--all'] : ['delete'], { cwd, stripColors: true, verbose })
      .wait('Are you sure you want to continue?')
      .sendline('y')
      .sendline('');

    if (deleteDeploymentBucket) {
      nrun
        .wait('Are you sure you want to continue to delete')
        .sendline('y')
        .sendline('');
    }

    nrun.wait('Project deleted locally.').run(async function(err: Error) {
      if (!err) {
        resolve();
      } else {
        reject(err);
      }
    });
  });
}
