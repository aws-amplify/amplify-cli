import { Input } from './domain/input';
import { pathManager } from 'amplify-cli-core';
import { logger } from 'amplify-cli-logger';
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
}
