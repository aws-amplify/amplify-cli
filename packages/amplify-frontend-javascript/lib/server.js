const chalk = require('chalk');
const { command: executeCommand } = require('execa');
const constants = require('./constants');

function run(context) {
  return new Promise((resolve, reject) => {
    const { projectConfig } = context.exeInfo;
    const startCommand = projectConfig[constants.Label].config.StartCommand;

    if (!startCommand) {
      throw new Error('Missing start command');
    }

    const serveExecution = executeCommand(startCommand, { cwd: process.cwd(), env: process.env, stdio: 'inherit' });

    let rejectFlag = false;
    serveExecution.on('exit', code => {
      context.print.info(`frontend start command exited with code ${code.toString()}`);
      if (code === 0) {
        resolve(context);
      } else if (!rejectFlag) {
        rejectFlag = true;
        reject(code);
      }
    });
    serveExecution.on('error', err => {
      context.print.error(chalk.red('frontend start command execution error'));
      context.print.info(err);
      if (!rejectFlag) {
        rejectFlag = true;
        reject(err);
      }
    });
  });
}

module.exports = {
  run,
};
