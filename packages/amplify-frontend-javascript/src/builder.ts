import { $TSContext } from 'amplify-cli-core';
import { red } from 'chalk';
import { command as executeCommand } from 'execa';
import { Label } from './constants';

/**
 Build the project
 */
export const run = (context: $TSContext): Promise<unknown> => new Promise((resolve, reject) => {
  const { projectConfig } = context.exeInfo;
  const buildCommand = projectConfig[Label].config.BuildCommand;

  if (!buildCommand) {
    throw new Error('Missing build command');
  }

  const buildExecution = executeCommand(buildCommand, { cwd: process.cwd(), env: process.env, stdio: 'inherit' });

  let rejectFlag = false;
  buildExecution.on('exit', code => {
    context.print.info(`frontend build command exited with code ${code?.toString()}`);
    if (code === 0) {
      resolve(context);
    } else if (!rejectFlag) {
      rejectFlag = true;
      reject(code);
    }
  });
  buildExecution.on('error', err => {
    context.print.error(red('frontend build command execution error'));
    context.print.info(err.message);
    if (!rejectFlag) {
      rejectFlag = true;
      reject(err);
    }
  });
});

export default { run };
