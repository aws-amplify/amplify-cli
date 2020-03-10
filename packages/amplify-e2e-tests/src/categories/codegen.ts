import { nspawn as spawn } from '../utils/nexpect';
import { getCLIPath, isCI } from '../utils';

export function generateModels(cwd: string) {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['codegen', 'models'], { cwd, stripColors: true }).run((err: Error) => {
      if (!err) {
        resolve();
      } else {
        reject(err);
      }
    });
  });
}
