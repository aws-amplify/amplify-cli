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
