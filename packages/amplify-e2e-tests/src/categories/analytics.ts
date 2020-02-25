import * as nexpect from '../utils/nexpect-modified';
import { getCLIPath, isCI } from '../utils';

export function addPinpoint(cwd: string, settings: any, verbose: boolean = !isCI()) {
  return new Promise((resolve, reject) => {
    nexpect
      .spawn(getCLIPath(), ['add', 'analytics'], { cwd, stripColors: true, verbose })
      .wait('Select an Analytics provider')
      .sendline('\r')
      .wait('Provide your pinpoint resource name:')
      .sendline(settings.wrongName)
      .wait('Resource name should be alphanumeric')
      .sendline('\r')
      .send('\b')
      .sendline(settings.rightName)
      .wait('Apps need authorization to send analytics events. Do you want to allow guests')
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

export function addKinesis(cwd: string, settings: any, verbose: boolean = !isCI()) {
  return new Promise((resolve, reject) => {
    nexpect
      .spawn(getCLIPath(), ['add', 'analytics'], { cwd, stripColors: true, verbose })
      .wait('Select an Analytics provider')
      .send('\x1b[B')
      .sendline('\r')
      .wait('Enter a Stream name')
      .sendline(settings.wrongName)
      .wait('Name is invalid.')
      .sendline('\r')
      .send('\b')
      .sendline(settings.rightName)
      .wait('Enter number of shards')
      .sendline('\r')
      .wait('Apps need authorization to send analytics events. Do you want to allow guests')
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
