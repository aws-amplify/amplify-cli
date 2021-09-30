import { nspawn as spawn, getCLIPath } from '..';

export function exportBackend(cwd: string, settings: { exportPath: string }): Promise<void> {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['export', '--out', settings.exportPath], { cwd, stripColors: true })
      .wait('For more information: docs.amplify.aws/cli/export')
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
