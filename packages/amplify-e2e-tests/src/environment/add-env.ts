import * as nexpect from 'nexpect';
import { getCLIPath, isCI } from '../utils';

export function addEnvironment(cwd: string, settings: any, verbose: Boolean = isCI() ? false : true) {
  return new Promise((resolve, reject) => {
    nexpect
      .spawn(getCLIPath(), ['env', 'add'], { cwd, stripColors: true, verbose })
      .wait('Do you want to use an existing environment?')
      .sendline('n')
      .wait('Enter a name for the environment')
      .sendline(settings.envName)
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
export function checkoutEnvironment(cwd: string, settings: any, verbose: Boolean = isCI() ? false : true) {
  return new Promise((resolve, reject) => {
    nexpect
      .spawn(getCLIPath(), ['env', 'checkout', settings.envName], { cwd, stripColors: true, verbose })
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

export function removeEnvironment(cwd: string, settings: any, verbose: Boolean = isCI() ? false : true) {
  return new Promise((resolve, reject) => {
    nexpect
      .spawn(getCLIPath(), ['env', 'remove', settings.envName], { cwd, stripColors: true, verbose })
      .wait(`Are you sure you want to continue? (This would delete '${settings.envName}' environment`)
      .sendline('y')
      .wait('Successfully removed environment from your project locally')
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}
