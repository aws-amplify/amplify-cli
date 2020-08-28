import { Input } from './domain/input';
import { pathManager } from 'amplify-cli-core';
import { logger } from 'amplify-cli-logger';

export function conditionalLoggingInit(input: Input): void {
  let path = pathManager.findProjectRoot();
  if (!path && input.command) {
    if (['pull', 'init'].includes(input.command)) {
      path = process.cwd();
    }
  }

  if (path) {
    logger.projectLocalLogInit(path);
  }
}
