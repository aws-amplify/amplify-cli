import * as nexpect from 'nexpect';
import { getCLIPath, isCI } from '../utils';

export function addEnvironment(cwd: string, settings: Object, verbose: Boolean = isCI() ? false : true) {
  return new Promise((resolve, reject) => {
    nexpect
      .spawn(getCLIPath(), ['env', 'add'], { cwd, stripColors: true, verbose })
      .wait('Do you want to use an existing environment?')
      .sendline('n')
      .wait('Enter a name for the environment')
      .sendline('test')
      .wait('Do you want to use an AWS profile?')
      .sendline('yes')
      .wait('Please choose the profile you want to use')
      .sendline('\r')
      .wait('Initialized your environment successfully.')
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}
