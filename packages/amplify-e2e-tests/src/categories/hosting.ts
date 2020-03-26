import { nspawn as spawn } from 'amplify-e2e-core';
import { getCLIPath } from '../utils';

export function addHosting(cwd: string) {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['add', 'hosting'], { cwd, stripColors: true })
      .wait('Select the plugin module to execute')
      .sendLine('j')
      .sendCarriageReturn()
      .wait('Select the environment setup:')
      .sendCarriageReturn()
      .wait('hosting bucket name')
      .sendCarriageReturn()
      .wait('index doc for the website')
      .sendCarriageReturn()
      .wait('error doc for the website')
      .sendCarriageReturn()
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}

export function amplifyPush(cwd: string) {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['push'], { cwd, stripColors: true })
      .wait('Are you sure you want to continue?')
      .sendCarriageReturn()
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}

export function removeHosting(cwd: string) {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['remove', 'hosting'], { cwd, stripColors: true })
      .wait('Choose the resource you would want to remove')
      .sendCarriageReturn()
      .wait('Are you sure you want to delete the resource?')
      .sendCarriageReturn()
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
