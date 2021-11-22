import { nspawn as spawn, getCLIPath } from '..';

export function amplifyOverrideRoot(cwd: string, settings: { testingWithLatestCodebase? : boolean }) {
  return new Promise((resolve, reject) => {
    const args = ['override', 'project'];

    spawn(getCLIPath(settings.testingWithLatestCodebase), args, { cwd, stripColors: true })
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
