const { spawn } = require('child_process');
const chalk = require('chalk');

const fs = require('fs-extra');
const archiver = require('archiver');

const DIR_NOT_FOUND_ERROR_MESSAGE = 'Please ensure your build artifacts path exists.';

function zipFile(sourceDir, destFilePath) {
  return new Promise((resolve, reject) => {
    if (!fs.pathExistsSync(sourceDir)) {
      reject(DIR_NOT_FOUND_ERROR_MESSAGE);
    }
    const zipFilePath = destFilePath;
    const output = fs.createWriteStream(zipFilePath);
    const archive = archiver('zip');

    output.on('close', () => {
      resolve(zipFilePath);
    });

    archive.on('error', err => {
      reject(err);
    });
    archive.pipe(output);
    archive.directory(sourceDir, false);
    archive.finalize();
  });
}

function run(command, projectDirectory) {
  if (!command) {
    throw new Error('Missing build command');
  }

  return new Promise((resolve, reject) => {
    let args = command.split(/\s+/);
    const cmd = args[0];
    args = args.slice(1);
    const execution = spawn(cmd, args, { cwd: projectDirectory, env: process.env, stdio: 'inherit' });

    let rejectFlag = false;
    execution.on('exit', code => {
      if (code === 0) {
        resolve();
      } else if (!rejectFlag) {
        rejectFlag = true;
        reject(code);
      }
    });

    execution.on('error', err => {
      console.log(chalk.red('command execution terminated with error'));
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
