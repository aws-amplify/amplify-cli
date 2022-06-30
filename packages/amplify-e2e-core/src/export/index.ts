import { nspawn as spawn, getCLIPath } from '..';

export function exportBackend(cwd: string, settings: { exportPath: string }): Promise<void> {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['export', '--out', settings.exportPath], { cwd, stripColors: true })
      .wait('For more information: https://docs.amplify.aws/cli/usage/export-to-cdk')
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

export function exportPullBackend(cwd: string, settings: { exportPath: string; frontend: string; rootStackName: string }): Promise<void> {
  return new Promise((resolve, reject) => {
    spawn(
      getCLIPath(),
      ['export', 'pull', '--out', settings.exportPath, '--frontend', settings.frontend, '--rootStackName', settings.rootStackName],
      { cwd, stripColors: true },
    )
      .wait('Successfully generated frontend config files')
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
