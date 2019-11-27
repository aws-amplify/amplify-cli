import * as nexpect from '../utils/nexpect-modified';
import { getCLIPath, isCI } from '../utils';

export function addAnalytics(cwd: string, settings: any, verbose: boolean = !isCI()) {
  return new Promise((resolve, reject) => {
    nexpect
      .spawn(getCLIPath(), ['add', 'analytics'], { cwd, stripColors: true, verbose })
      .wait('Provide your pinpoint resource name:')
      .sendline('$')
      .wait("Resource name should be alphanumeric or can contain '-'")
      .sendline('\r')
      .send('\b')
      .sendline(settings.rightName)
      .wait('Adding analytics would add the Auth category to the project if not already added.')
      .sendline('n')
      .wait(`Successfully added resource ${settings.rightName} locally`)
      .sendEof()
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}

export function removeAnalytics(cwd: string, settings: any, verbose: boolean = !isCI()) {
  return new Promise((resolve, reject) => {
    nexpect
      .spawn(getCLIPath(), ['remove', 'analytics'], { cwd, stripColors: true, verbose })
      .wait('Choose the resource you would want to remove')
      .send('j')
      .sendline('\r')
      .wait('Are you sure you want to delete the resource?')
      .send('y')
      .sendline('\r')
      .wait('Successfully removed resource')
      .sendEof()
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}
