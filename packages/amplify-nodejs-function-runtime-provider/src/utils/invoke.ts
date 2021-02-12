import * as execa from 'execa';
import { Readable } from 'stream';
import { executorPath } from './executorPath';

export const invoke = async (options: InvokeOptions): Promise<any> => {
  const lambdaExecution = execa.node(executorPath, [], {
    env: options.environment,
    extendEnv: false,
    stdio: ['ignore', 'inherit', 'inherit', 'pipe'],
  });
  lambdaExecution.send(options);
  const childPipe = ((lambdaExecution.stdio as any)[3] as unknown) as Readable;
  childPipe.setEncoding('utf-8');
  let data = '';

  return new Promise((resolve, reject) => {
    const closeHandler = () => {
      const { result, error }: { result?: any; error?: any } = JSON.parse(data);
      if (error) {
        reject(error);
      } else if (typeof result === 'undefined') {
        resolve(null);
      } else {
        resolve(result);
      }
    };
    childPipe.on('data', (d: string) => {
      data += d;
    });
    childPipe.on('close', closeHandler);
    childPipe.on('end', closeHandler);
    childPipe.on('error', reject);
  });
};

export type InvokeOptions = {
  packageFolder: string;
  handler: string;
  event: string;
  context?: object;
  environment?: { [key: string]: string };
};
