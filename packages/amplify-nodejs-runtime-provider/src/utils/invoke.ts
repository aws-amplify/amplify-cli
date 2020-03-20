import { fork } from 'child_process';
import { InvokeOptions } from './invokeOptions';

// copied from amplify-util-mock with slight modifications
export function invoke(options: InvokeOptions): Promise<any> {
  return new Promise((resolve, reject) => {
    try {
      const lambdaFn = fork(`${__dirname}/execute.js`, [], {
        execArgv: [],
        env: options.environment || {},
      });
      lambdaFn.on('message', msg => {
        const result = JSON.parse(msg);
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
