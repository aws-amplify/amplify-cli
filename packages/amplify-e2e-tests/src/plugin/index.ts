export * from './new-plugin';
export * from './verifyPluginStructure';

import { nspawn as spawn, getCLIPath } from 'amplify-e2e-core';
export function help(cwd: string) {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['plugin', 'help'], { cwd, stripColors: true })
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

export function scan(cwd: string) {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['plugin', 'scan'], { cwd, stripColors: true })
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

export function listActive(cwd: string) {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['plugin', 'list'], { cwd, stripColors: true })
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

export function listExcluded(cwd: string) {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['plugin', 'list'], { cwd, stripColors: true })
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

export function listGeneralInfo(cwd: string) {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['plugin', 'list'], { cwd, stripColors: true })
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
