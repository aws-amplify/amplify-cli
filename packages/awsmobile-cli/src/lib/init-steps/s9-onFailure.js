const chalk = require('chalk');
const util = require('util');

function run(e) {
  console.log(chalk.red('init failed'));
  console.log(util.inspect(e));
}

module.exports = {
  run,
};
