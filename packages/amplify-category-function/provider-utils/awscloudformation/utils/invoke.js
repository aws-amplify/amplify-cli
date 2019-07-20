const path = require('path');
const fs = require('fs');

function loadFunction(fileName) {
  return require(path.resolve(fileName));
}
/*
var options = this.options({
    'packageFolder': './',
    'handler': 'handler',
    'fileName': 'index.js',
    'event': 'event.json'
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

  const callback = (error, object) => {
    context.done(error, object);
  };

  const lambda = loadFunction(options.fileName);
  const event = JSON.parse(fs.readFileSync(path.resolve(options.event), 'utf8'));
  lambda[options.handler](event, context, callback);
}


module.exports = {
  invokeFunction,
};
