import * as util from '../util';
import { nspawn as spawn } from 'amplify-e2e-core';

export function headlessPull(projectRootDirPath: string, amplifyParam: Object, providersParam: Object, authConfig?: Object): Promise<void> {
  const pullCommand: string[] = [
    'pull',
    '--amplify',
    JSON.stringify(amplifyParam),
    '--providers',
    JSON.stringify(providersParam),
    '--no-override',
    '--yes',
  ];
  if (authConfig) pullCommand.push(`--categories ${JSON.stringify(authConfig)}`);
  return new Promise((resolve, reject) => {
    spawn(util.getCLIPath(), pullCommand, { cwd: projectRootDirPath, stripColors: true }).run((err: Error) => {
      if (!err) {
        resolve();
      } else {
        reject(err);
      }
    });
  });
}
