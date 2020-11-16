import { InvokeOptions } from './invokeOptions';
import path from 'path';
import * as execa from 'execa';

// copied from amplify-util-mock with slight modifications
export function invoke(options: InvokeOptions): Promise<any> {
  return new Promise((resolve, reject) => {
    try {
      let data: string = '';
      const lambdaFn = execa.node(path.join(__dirname, 'execute.js'), [], {
        env: options.environment || {},
      });
      lambdaFn.stdout.on('data', msg => {
        data += msg;
      });
      let inClosePromise: Promise<void> | null;
      const onClose = async () => {
        const lines = data.split('\n');
        if (lines.length > 1) {
          const logs = lines.slice(0, -1).join('\n');
          console.log(logs);
        }
        const lastLine = lines[lines.length - 1];
        try {
          const result = JSON.parse(lastLine);
          if (result.error) {
            reject(result.error);
          }
          resolve(result.result);
        } catch {
          resolve(lastLine);
        }
      };
      lambdaFn.on('close', () => {
        inClosePromise = onClose();
      });
      lambdaFn.catch(err => {
        const rejectWithClose = () => {
          if (inClosePromise) {
            inClosePromise.finally(() => {
              reject(err.message);
            });
          } else {
            reject(err.message);
          }
        };

        if (data.length > 0) {
          setTimeout(() => rejectWithClose(), 2000);
        } else {
          rejectWithClose();
        }
      });
      lambdaFn.send(JSON.stringify(options));
    } catch (e) {
      reject(e);
    }
  });
}
