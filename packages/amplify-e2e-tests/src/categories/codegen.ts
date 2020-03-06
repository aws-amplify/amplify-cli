import { nspawn as spawn } from '../utils/nexpect';
import { getCLIPath, isCI } from '../utils';

export function generateModels(cwd: string, verbose: boolean = !isCI()) {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['codegen', 'models'], { cwd, stripColors: true, verbose }).run((err: Error) => {
      if (!err) {
        resolve();
      } else {
        reject(err);
      }
    });
  });
}
