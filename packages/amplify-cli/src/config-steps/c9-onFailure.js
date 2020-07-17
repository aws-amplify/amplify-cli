const print = require('../extensions/amplify-helpers/print');
const util = require('util');

function run(e) {
  print.error('Error occurred during configuration.');
  print.info(util.inspect(e));
}

module.exports = {
  run,
};
