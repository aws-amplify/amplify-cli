const hostingModule = require('../hosting/index');
const chalk = require('chalk');

async function run(context) {
  try {
    await hostingModule.status(context, false);
  } catch (err) {
    if (err.name === 'ValidationError') {
      console.log(chalk.red(err.message));
    } else {
      throw err;
    }
  }
}

module.exports = {
  run,
};
