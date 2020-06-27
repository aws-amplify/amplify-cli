import * as util from '../util';
import { nspawn as spawn } from 'amplify-e2e-core';

export function headlessPull(
  projectRootDirPath: string,
  amplifyParam: Object,
  providersParam: Object,
  categoryConfig?: Object,
): Promise<void> {
  const pullCommand: string[] = [
    'pull',
    '--amplify',
    JSON.stringify(amplifyParam),
    '--providers',
    JSON.stringify(providersParam),
    '--no-override',
    '--yes',
  ];
  if (categoryConfig) pullCommand.push(...['--categories', JSON.stringify(categoryConfig)]);
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
