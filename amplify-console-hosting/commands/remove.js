const hostingModule = require('../hosting/index');
const chalk = require('chalk');

async function run(context) {
  try {
    await hostingModule.remove(context);
  } catch (err) {
    if (err.name === 'ValidationError') {
      console.log(chalk.red(err.message));
    } else {
      console.log(err.name);
      console.log(err.message);
    }
  }
}

module.exports = {
  run,
};
