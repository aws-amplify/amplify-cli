const { print } = require('gluegun/print');
const util = require('util');

function run(e) {
  print.error('init failed');
  print.info(util.inspect(e));
  // Exit the process with a failure code
  process.exit(1);
}

module.exports = {
  run,
};
