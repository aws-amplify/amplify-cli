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
  console.log('Testing function locally');
  let cwd;
  if (options.packageFolder) {
    cwd = process.cwd();
    process.chdir(path.resolve(options.packageFolder));
  }

  const context = {
    done(error, result) {
      if (error === null || typeof (error) === 'undefined') {
        context.succeed(result);
      } else {
        context.fail(error);
      }
    },
    succeed(result) {
      if (cwd) {
        process.chdir(cwd);
      }
      console.log('');
      console.log('Success!  Message:');
      console.log('------------------');
      const msg = (typeof (result) === 'object') ? JSON.stringify(result) : result;
      console.log((typeof (result) !== 'undefined') ? msg : 'Successful!');
    },
    fail(error) {
      if (cwd) {
        process.chdir(cwd);
      }
      console.log('');
      console.log('Failure!  Message:');
      console.log('------------------');
      const msg = (typeof (error) === 'object') ? JSON.stringify(error) : error;
      console.log((typeof (error) !== 'undefined') ? msg : 'Error not provided.');
    },
    awsRequestId: 'LAMBDA_INVOKE',
    logStreamName: 'LAMBDA_INVOKE',
  };

  if (options.context) {
    Object.assign(context, options.context);
  }

  const callback = (error, object) => {
    context.done(error, object);
  };

  const lambda = loadFunction(options.fileName);
  const { event } = options;
  lambda[options.handler](event, context, callback);
}


module.exports = {
  invokeFunction,
};
