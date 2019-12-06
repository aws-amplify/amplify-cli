import * as nexpect from 'nexpect';
import { getCLIPath, isCI } from '../utils';

export function addHosting(cwd: string, verbose: boolean = !isCI()) {
  return new Promise((resolve, reject) => {
    nexpect
      .spawn(getCLIPath(), ['add', 'hosting'], { cwd, stripColors: true, verbose })
      .wait('Select the environment setup:')
      .sendline('\r')
      .wait('hosting bucket name')
      .sendline('\r')
      .wait('index doc for the website')
      .sendline('\r')
      .wait('error doc for the website')
      .sendline('\r')
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}

export function amplifyPush(cwd: string, verbose: boolean = !isCI()) {
  return new Promise((resolve, reject) => {
    nexpect
      .spawn(getCLIPath(), ['push'], { cwd, stripColors: true, verbose })
      .wait('Are you sure you want to continue?')
      .sendline('\r')
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}

export function removeHosting(cwd: string, verbose: boolean = !isCI()) {
  return new Promise((resolve, reject) => {
    nexpect
      .spawn(getCLIPath(), ['remove', 'hosting'], { cwd, stripColors: true, verbose })
      .wait('Choose the resource you would want to remove')
      .sendline('\r')
      .wait('Are you sure you want to delete the resource?')
      .sendline('\r')
      .wait('Successfully removed resource')
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}
