import { existsSync, createWriteStream } from 'fs-extra';
import { InvokeOptions } from './invoke';
import path from 'path';
import exit from 'exit';
import { AmplifyError } from '@aws-amplify/amplify-cli-core';

process.on('message', (options: InvokeOptions) => {
  const parentPipe = createWriteStream('', { fd: 3 });
  parentPipe.setDefaultEncoding('utf-8');
  void invokeFunction(options)
    .then((result) => {
      parentPipe.write(JSON.stringify({ result }));
    })
    .catch((error) => {
      let plainError = error;
      if (typeof error === 'object') {
        plainError = Object.getOwnPropertyNames(error).reduce((acc, key) => {
          acc[key] = error[key];
          return acc;
        }, {} as Record<string, any>);
      }
      parentPipe.write(JSON.stringify({ error: plainError }));
    })
    .then(() => {
      exit(0);
    });
});

const invokeFunction = async (options: InvokeOptions) => {
  if (options.packageFolder) {
    const p = path.resolve(options.packageFolder);
    if (!existsSync(p)) {
      throw new AmplifyError('LambdaFunctionInvokeError', { message: `Lambda package folder ${options.packageFolder} does not exist` });
    }
    process.chdir(p);
  } else {
    throw new AmplifyError('LambdaFunctionInvokeError', { message: `Invalid lambda invoke request. No package folder specified.` });
  }
  if (!options.handler) {
    throw new AmplifyError('LambdaFunctionInvokeError', { message: `Invalid lambda invoke request. No handler specified.` });
  }

  const lambdaHandler = await loadHandler(options.packageFolder, options.handler);
  const event = JSON.parse(options.event);

  const lambdaMockContext = {
    functionName: 'mock-function-name',
    functionVersion: '1',
    invokedFunctionArn: 'mock-function-arn',
    memoryLimitInMB: '128',
    awsRequestId: 'LAMBDA_INVOKE',
    logGroupName: 'LAMBDA_INVOKE',
    logStreamName: 'LAMBDA_INVOKE',
    callbackWaitsForEmptyEventLoop: true,
    ...options.context,
  };

  return new Promise((resolve, reject) => {
    const callback = (error: any, response: any) => {
      if (error) {
        reject(error);
      } else {
        resolve(response);
      }
    };
    try {
      const lambdaPromise = lambdaHandler(event, lambdaMockContext, callback);
      if (typeof lambdaPromise === 'object' && typeof lambdaPromise.then === 'function') {
        resolve(lambdaPromise);
      }
    } catch (e) {
      reject(e);
    }
  });
};

// handler is a string like 'path/to/handler.func'
// eslint-disable-next-line @typescript-eslint/ban-types
const loadHandler = async (root: string, handler: string): Promise<Function> => {
  const handlerParts = path.parse(handler);
  try {
    const handler = await import(path.join(root, handlerParts.dir, handlerParts.name));
    const handlerFuncName = handlerParts.ext.replace('.', '');
    const handlerFunc = handler?.[handlerFuncName];
    if (typeof handlerFunc !== 'function') {
      throw new AmplifyError('LambdaFunctionInvokeError', {
        message: `Lambda handler ${handlerParts.name} has no exported function named ${handlerFuncName}`,
      });
    }
    return handlerFunc;
  } catch (err) {
    throw new AmplifyError('LambdaFunctionInvokeError', { message: `Could not load lambda handler function due to ${err}` }, err);
  }
};
