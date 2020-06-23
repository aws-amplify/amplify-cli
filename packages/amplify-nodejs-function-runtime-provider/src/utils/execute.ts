import { existsSync } from 'fs-extra';
import { InvokeOptions } from './invokeOptions';
import path from 'path';
import _ from 'lodash';

//  copied from amplify-util-mock with slight modifications

// handler is a string like 'path/to/handler.func'
async function loadHandler(root: string, handler: string): Promise<Function> {
  const handlerParts = path.parse(handler);
  try {
    const handler = await import(path.join(root, handlerParts.dir, handlerParts.name));
    return handler[handlerParts.ext.replace('.', '')];
  } catch (err) {
    throw new Error(`Could not load lambda handler function due to ${err}`);
  }
}

export function invokeFunction(options: InvokeOptions) {
  return new Promise(async (resolve, reject) => {
    let returned = false;

    const context = {
      done(error: any, result: any) {
        if (!returned) {
          returned = true;
          if (error === null || typeof error === 'undefined') {
            context.succeed(result);
          } else {
            context.fail(error);
          }
        }
      },
      succeed(result: any) {
        returned = true;
        resolve(result);
      },
      fail(error: any) {
        returned = true;
        reject(error);
      },
      awsRequestId: 'LAMBDA_INVOKE',
      logStreamName: 'LAMBDA_INVOKE',
    };

    if (options.packageFolder) {
      const p = path.resolve(options.packageFolder);
      if (!existsSync(p)) {
        context.fail(`packageFolder ${options.packageFolder} does not exist`);
        return;
      }
      process.chdir(p);
    } else {
      context.fail('packageFolder is not defined');
      return;
    }

    if (!options.handler) {
      context.fail('handler is not defined');
      return;
    }

    if (options.context) {
      Object.assign(context, options.context);
    }

    const callback = (error: any, object: any) => {
      context.done(error, object);
    };

    const lambdaHandler = await loadHandler(options.packageFolder, options.handler);
    const { event } = options;
    try {
      const response = lambdaHandler(JSON.parse(event), context, callback);
      if (typeof response === 'object' && typeof response.then === 'function') {
        const result = await response;
        if (result !== undefined) {
          context.done(null, result);
        } else {
          context.done(null, null);
        }
      } else if (response !== undefined) {
        context.done(null, null);
      }
    } catch (e) {
      context.done(e, null);
    }
  });
}

process.on('message', async options => {
  try {
    const result = await invokeFunction(JSON.parse(options));
    process.send!(JSON.stringify({ result, error: null }));
  } catch (error) {
    process.send!(
      JSON.stringify({
        result: null,
        error: {
          type: 'Lambda:Unhandled',
          message: error.message,
        },
      }),
    );
  }
  process.exit(1);
});
