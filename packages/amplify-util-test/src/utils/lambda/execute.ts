const path = require('path');

function loadFunction(fileName) {
  return require(path.resolve(fileName));
}
/*
var options = this.options({
    'packageFolder': './', //required
    'handler': 'handler', // required
    'fileName': 'index.js', // required
    'event': 'event.json', // required
    'context': 'context.json' // optional
});
*/
function invokeFunction(options) {
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
      process.chdir(path.resolve(options.packageFolder));
    } else {
      context.fail('packageFolder is not defined');
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
      const result = await lambda[options.handler](event, context, callback);
      context.done(null, result);
    } catch (e) {
      context.done(e, null);
    }
  });
}

process.on('message', async (options) => {
  try {
    const result = await invokeFunction(JSON.parse(options));
    process.send(JSON.stringify({ result, error: null }));
    process.exit(0);
  } catch (error) {
    process.send(JSON.stringify({ result: null, error }));
    process.exit(1);
  }
});
