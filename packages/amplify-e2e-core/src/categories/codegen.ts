import { getCLIPath, nspawn as spawn } from '..';

export function generateModels(cwd: string): Promise<void> {
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

export function generateModelIntrospection(cwd: string, outputDir?: string): Promise<void> {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['codegen', 'model-introspection', '--output-dir', outputDir || cwd], { cwd, stripColors: true }).run((err: Error) => {
      if (!err) {
        resolve();
      } else {
        reject(err);
      }
    });
  });
}
