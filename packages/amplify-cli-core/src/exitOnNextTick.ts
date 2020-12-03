import { logger } from 'amplify-cli-logger';

export function exitOnNextTick(code: number): void {
  process.nextTick(() => {
    logger.loggerEnd();
    process.exit(code);
  });
}
