import { logger } from 'amplify-cli-logger';

export function exitOnNextTick(code: number): void {
  logger.loggerEnd();
  process.exit(code);
}
