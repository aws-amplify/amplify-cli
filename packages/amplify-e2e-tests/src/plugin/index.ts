export * from './new-plugin';
export * from './verifyPluginStructure';

import { nspawn as spawn } from '../utils/nexpect';
import { getCLIPath, isCI } from '../utils';

export function help(cwd: string, verbose: boolean = isCI() ? false : true) {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['plugin', 'help'], { cwd, stripColors: true, verbose })
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

export function scan(cwd: string, verbose: boolean = isCI() ? false : true) {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['plugin', 'scan'], { cwd, stripColors: true, verbose })
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

export function listActive(cwd: string, verbose: boolean = isCI() ? false : true) {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['plugin', 'list'], { cwd, stripColors: true, verbose })
      .wait('Select the section to list')
      .sendLine('')
      .wait('Select the name of the plugin to list')
      .sendLine('k')
      .run(function(err: Error) {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}

export function listExcluded(cwd: string, verbose: boolean = isCI() ? false : true) {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['plugin', 'list'], { cwd, stripColors: true, verbose })
      .wait('Select the section to list')
      .sendLine('j')
      .run(function(err: Error) {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}

export function listGeneralInfo(cwd: string, verbose: boolean = isCI() ? false : true) {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['plugin', 'list'], { cwd, stripColors: true, verbose })
      .wait('Select the section to list')
      .sendLine('j')
      .run(function(err: Error) {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}
