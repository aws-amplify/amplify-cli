import { Input } from './domain/input';
import { JSONUtilities, pathManager } from 'amplify-cli-core';
import { logger, Redactor } from 'amplify-cli-logger';
import path from 'path';
import { constants } from './domain/constants';
export function conditionalLoggingInit(input: Input): void {
  let projectPath = pathManager.findProjectRoot();
  if (!projectPath && input.command) {
    if (['pull', 'init'].includes(input.command)) {
      projectPath = process.cwd();
    }
  }

  if (projectPath) {
    logger.projectLocalLogInit(path.join(projectPath, constants.Amplify));
  }
  logger.logInfo({
    message: `amplify ${input.command} \
${input.subCommands ? input.subCommands.join(' ') : ''} \
${input.options ? Redactor(JSONUtilities.stringify(input.options, { minify: true })) : ''}`,
  });
}
