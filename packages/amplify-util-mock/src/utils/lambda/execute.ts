import { fstat, existsSync } from 'fs-extra';

const path = require('path');

function loadFunction(fileName) {
  return require(path.resolve(fileName));
}

type InvokeOptions = {
  packageFolder: string;
  handler: string;
  fileName: string;
  event: string;
  context?: object;
};

function invokeFunction(options: InvokeOptions) {
  return new Promise(async (resolve, reject) => {
    let returned = false;

    const context = {
      done(error, result) {
        if (!returned) {
          returned = true;
          if (error === null || typeof error === 'undefined') {
            context.succeed(result);
          } else {
            context.fail(error);
          }
        }
      },
      succeed(result) {
        returned = true;
        resolve(result);
      },
      fail(error) {
        returned = true;
        reject(error);
      },
      awsRequestId: 'LAMBDA_INVOKE',
      logStreamName: 'LAMBDA_INVOKE',
    };

    if (options.packageFolder) {
      const p = path.resolve(options.packageFolder);
      if (!existsSync(p)) {
        context.fail('packageFolder does not exist');
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

    const callback = (error, object) => {
      context.done(error, object);
    };

    const lambda = loadFunction(options.fileName);
    const { event } = options;
    try {
      if (!lambda[options.handler]) {
        context.fail(
          `handler ${options.handler} does not exist in the lambda function ${path.join(
            options.packageFolder,
            options.fileName
          )}`
        );
        return;
      }
      const result = await lambda[options.handler](event, context, callback);
      if (result !== undefined) {
        context.done(null, result);
      }
    } catch (e) {
      context.done(e, null);
    }
  });
}

process.on('message', async options => {
  try {
    const result = await invokeFunction(JSON.parse(options));
    process.send(JSON.stringify({ result, error: null }));
  } catch (error) {
    process.send(JSON.stringify({ result: null, error }));
    process.exit(1);
  }
});
