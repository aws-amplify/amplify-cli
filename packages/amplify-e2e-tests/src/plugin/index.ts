export * from './new-plugin';
export * from './verifyPluginStructure';

import * as nexpect from 'nexpect';
import { getCLIPath, isCI } from '../utils';

export function help(cwd: string, verbose: Boolean = isCI() ? false : true) {
  return new Promise((resolve, reject) => {
    nexpect
      .spawn(getCLIPath(), ['plugin', 'help'], { cwd, stripColors: true, verbose })
      .wait(/.*/)
      .run(function(err: Error) {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}

export function scan(cwd: string, verbose: Boolean = isCI() ? false : true) {
  return new Promise((resolve, reject) => {
    nexpect
      .spawn(getCLIPath(), ['plugin', 'scan'], { cwd, stripColors: true, verbose })
      .wait(/.*/)
      .run(function(err: Error) {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}

export function listActive(cwd: string, verbose: Boolean = isCI() ? false : true) {
  return new Promise((resolve, reject) => {
    nexpect
      .spawn(getCLIPath(), ['plugin', 'list'], { cwd, stripColors: true, verbose })
      .wait('Select the section to list')
      .sendline('')
      .wait('Select the name of the plugin to list')
      .sendline('k')
      .run(function(err: Error) {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}

export function listExcluded(cwd: string, verbose: Boolean = isCI() ? false : true) {
  return new Promise((resolve, reject) => {
    nexpect
      .spawn(getCLIPath(), ['plugin', 'list'], { cwd, stripColors: true, verbose })
      .wait('Select the section to list')
      .sendline('j')
      .sendline('')
      .run(function(err: Error) {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}

export function listGeneralInfo(cwd: string, verbose: Boolean = isCI() ? false : true) {
  return new Promise((resolve, reject) => {
    nexpect
      .spawn(getCLIPath(), ['plugin', 'list'], { cwd, stripColors: true, verbose })
      .wait('Select the section to list')
      .send('j')
      .sendline('j')
      .run(function(err: Error) {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}
