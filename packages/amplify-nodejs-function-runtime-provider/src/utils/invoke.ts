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
      lambdaFn.on('close', () => {
        const lines = data.split('\n');
        if (lines.length > 1) {
          const logs = lines.slice(0, -1).join('\n');
          console.log(logs);
        }
        const lastLine = lines[lines.length - 1];
        const result = JSON.parse(lastLine);
        if (result.error) {
          reject(result.error);
        }
        resolve(result.result);
      });
      lambdaFn.send(JSON.stringify(options));
    } catch (e) {
      reject(e);
    }
  });
}
