const { command: executeCommand } = require('execa');
const fs = require('fs-extra');
const path = require('path');
const archiver = require('archiver');
const { AmplifyError } = require('@aws-amplify/amplify-cli-core');

const DIR_NOT_FOUND_ERROR_MESSAGE = 'Please ensure your build artifacts path exists.';

function zipFile(sourceDir, destFilePath, extraFiles) {
  return new Promise((resolve, reject) => {
    if (!fs.pathExistsSync(sourceDir)) {
      reject(new Error(DIR_NOT_FOUND_ERROR_MESSAGE));
    }
    const zipFilePath = destFilePath;
    const output = fs.createWriteStream(zipFilePath);
    const archive = archiver('zip');

    output.on('close', () => {
      resolve(zipFilePath);
    });

    archive.on('error', (err) => {
      reject(err);
    });
    archive.pipe(output);
    archive.directory(sourceDir, false);

    if (extraFiles && extraFiles.length && extraFiles.length > 0) {
      for (const filePath of extraFiles) {
        const fileName = path.basename(filePath);

        archive.file(filePath, { name: fileName });
      }
    }

    archive.finalize().catch(reject);
  });
}

async function run(command, projectDirectory) {
  if (!command) {
    throw new AmplifyError('ProjectBuildCommandError', {
      message: `Missing build command: ${command}`,
      resolution: 'Run `amplify configure project` to set the build command.',
      link: 'https://docs.amplify.aws/cli/start/workflows/#amplify-configure-project',
    });
  }

  try {
    await executeCommand(command, { cwd: projectDirectory, env: process.env, stdio: 'inherit' });
  } catch (cause) {
    throw new AmplifyError(
      `ProjectBuildCommandError`,
      {
        message: `Build command "${command}" exited with failure`,
        resolution: 'Check the console output for more information, or run `amplify configure project` to change the build command.',
        link: 'https://docs.amplify.aws/cli/start/workflows/#amplify-configure-project',
      },
      cause,
    );
  }
}

module.exports = {
  run,
  zipFile,
};
