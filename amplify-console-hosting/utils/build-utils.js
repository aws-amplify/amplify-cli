const { spawn } = require('child_process');
const chalk = require('chalk');

const fs = require('fs-extra');
const archiver = require('archiver');
const path = require('path');
const ora = require('ora');

const DIR_NOT_FOUND_ERROR_MESSAGE = 'Please ensure your build path exist';
const ZIPPING_MESSAGE = 'Zipping artifacts.. ';
const ZIPPING_SUCCESS_MESSAGE = 'Zipping artifacts completed.';
const ZIPPING_FAILURE_MESSAGE = 'Zipping artifacts failed.';

function zipFile(sourceDir, destDir) {
  return new Promise((resolve, reject) => {
    const spinner = ora();
    if (!fs.pathExistsSync(sourceDir)) {
      reject(DIR_NOT_FOUND_ERROR_MESSAGE);
    }
    spinner.start(ZIPPING_MESSAGE);
    const now = new Date();
    const zipFilePath = path.join(destDir, `${now.getTime()}.zip`);
    const output = fs.createWriteStream(zipFilePath);
    const archive = archiver('zip');
    output.on('close', () => {
      spinner.succeed(ZIPPING_SUCCESS_MESSAGE);
      resolve(zipFilePath);
    });
    archive.on('error', (err) => {
      spinner.fail(ZIPPING_FAILURE_MESSAGE);
      reject(err);
    });
    archive.pipe(output);
    archive.directory(sourceDir, false);
    archive.finalize();
  });
}

function run(command, projectDirectory) {
  return new Promise((resolve, reject) => {
    let args = command.split(/\s+/);
    const cmd = args[0];
    args = args.slice(1);
    const execution = spawn(cmd, args, { cwd: projectDirectory, env: process.env, stdio: 'inherit' });

    let rejectFlag = false;
    execution.on('exit', (code) => {
      if (code === 0) {
        resolve();
      } else if (!rejectFlag) {
        rejectFlag = true;
        reject(code);
      }
    });

    execution.on('error', (err) => {
      console.log(chalk.red('command execution teminated with error'));
      if (!rejectFlag) {
        rejectFlag = true;
        reject(err);
      }
    });
  });
}

module.exports = {
  run,
  zipFile,
};
