import path from 'path';
import * as execa from 'execa';

export type InvokeOptions = {
  packageFolder: string;
  handler: string;
  event: string;
  context?: object;
  environment?: { [key: string]: string };
};

export const getLambdaChildProcess = (environment: any, functionName: string = 'execute.js'): execa.ExecaChildProcess => {
  return execa.node(path.join(__dirname, functionName), [], {
    env: environment || {},
  });
}