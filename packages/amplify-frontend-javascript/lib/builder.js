const chalk = require('chalk');
const { spawn } = require('child_process');
const constants = require('./constants');

function run(context) {
  return new Promise((resolve, reject) => {
    const { projectConfig } = context.exeInfo;
    const buildCommand = projectConfig[constants.Label].config.BuildCommand;
    let args = buildCommand.split(/\s+/);
    const command = normalizeCommand(args[0]);
    args = args.slice(1);

    const buildExecution = spawn(command, args, { cwd: process.cwd(), env: process.env, stdio: 'inherit' });

    let rejectFlag = false;
    buildExecution.on('exit', (code) => {
      context.print.info(`frontend build command exited with code ${code.toString()}`);
      if (code === 0) {
        resolve(context);
      } else if (!rejectFlag) {
        rejectFlag = true;
        reject(code);
      }
    });
    buildExecution.on('error', (err) => {
      context.print.error(chalk.red('frontend build command execution error'));
      context.print.info(err);
      if (!rejectFlag) {
        rejectFlag = true;
        reject(err);
      }
    });
  });
}

function normalizeCommand(command) {
  let result = command;
  const isOnWindows = /^win/.test(process.platform);
  if (isOnWindows) {
    if (command === 'npm') {
      result = 'npm.cmd';
    } else if (command === 'yarn') {
      result = 'yarn.cmd';
    }
  } else if (command === 'npm.cmd') {
    result = 'npm';
  } else if (command === 'yarn.cmd') {
    result = 'yarn';
  }
  return result;
}

module.exports = {
  run,
};
