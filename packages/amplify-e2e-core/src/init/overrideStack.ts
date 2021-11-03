import { nspawn as spawn, getCLIPath } from '..';

export function amplifyOverrideRoot(cwd: string, settings: {}) {
  return new Promise((resolve, reject) => {
    const args = ['override', 'project'];

    spawn(getCLIPath(), args, { cwd, stripColors: true })
      .wait('Do you want to edit override.ts file now?')
      .sendConfirmNo()
      .sendEof()
      .run((err: Error) => {
        if (!err) {
          resolve({});
        } else {
          reject(err);
        }
      });
  });
}

export function amplifyOverrideAuth(cwd: string, settings: {}) {
  return new Promise((resolve, reject) => {
    const args = ['override', 'auth'];

    spawn(getCLIPath(), args, { cwd, stripColors: true })
      .wait('Do you want to edit override.ts file now?')
      .sendConfirmNo()
      .sendEof()
      .run((err: Error) => {
        if (!err) {
          resolve({});
        } else {
          reject(err);
        }
      });
  });
}

export function amplifyOverrideApi(cwd: string, settings: {}) {
  return new Promise((resolve, reject) => {
    const args = ['override', 'api'];

    spawn(getCLIPath(), args, { cwd, stripColors: true })
      .wait('Do you want to edit override.ts file now?')
      .sendConfirmNo()
      .sendEof()
      .run((err: Error) => {
        if (!err) {
          resolve({});
        } else {
          reject(err);
        }
      });
  });
}
