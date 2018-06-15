const { print } = require('gluegun/print');
const util = require('util');

function run(e) {
  print.error('init failed');
  print.info(util.inspect(e));
}

module.exports = {
  run,
};
