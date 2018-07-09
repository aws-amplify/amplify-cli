const { print } = require('gluegun/print');
const util = require('util');

function run(e) {
  print.error('Error occured during configuration.');
  print.info(util.inspect(e));
}

module.exports = {
  run,
};
