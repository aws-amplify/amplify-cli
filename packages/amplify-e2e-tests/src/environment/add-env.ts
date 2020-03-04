import { nspawn as spawn } from '../utils/nexpect';
import { getCLIPath, isCI } from '../utils';

export function addEnvironment(cwd: string, settings: any, verbose: boolean = !isCI()) {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['env', 'add'], { cwd, stripColors: true, verbose })
      .wait('Do you want to use an existing environment?')
      .sendLine('n')
      .wait('Enter a name for the environment')
      .sendLine(settings.envName)
      .wait('Do you want to use an AWS profile?')
      .sendLine('yes')
      .wait('Please choose the profile you want to use')
      .sendCarriageReturn()
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
export function checkoutEnvironment(cwd: string, settings: any, verbose: boolean = !isCI()) {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['env', 'checkout', settings.envName], { cwd, stripColors: true, verbose })
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

export function removeEnvironment(cwd: string, settings: any, verbose: boolean = !isCI()) {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['env', 'remove', settings.envName], { cwd, stripColors: true, verbose })
      .wait(`Are you sure you want to continue? (This would delete '${settings.envName}' environment`)
      .sendLine('y')
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
