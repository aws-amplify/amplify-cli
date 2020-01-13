const path = require('path');

const loadFunction = fileName => {
  return require(path.resolve(fileName));
};
/*
var options = this.options({
    'packageFolder': './', //required
    'handler': 'handler', // required
    'fileName': 'index.js', // required
    'event': 'event.json' // required
});
*/
const invokeFunction = async options => {
  console.log('Testing function locally');
  let cwd;
  if (options.packageFolder) {
    cwd = process.cwd();
    process.chdir(path.resolve(options.packageFolder));
  }

  const lambda = loadFunction(options.fileName);
  const { event } = options;

  try {
    const result = await lambda[options.handler](event);

    console.log('');
    console.log('Success!  Message:');
    console.log('------------------');
    const msg = typeof result === 'object' ? JSON.stringify(result) : result;
    console.log(typeof result !== 'undefined' ? msg : 'Successful!');
  } catch (error) {
    console.log('');
    console.log('Failure!  Message:');
    console.log('------------------');
    const msg = typeof error === 'object' ? JSON.stringify(error) : error;
    console.log(typeof error !== 'undefined' ? msg : 'Error not provided.');
  } finally {
    if (cwd) {
      process.chdir(cwd);
    }
  }
};

module.exports = {
  invokeFunction,
};
