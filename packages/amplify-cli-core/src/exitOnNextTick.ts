import { logger } from "amplify-cli-logger";

/**
 * closes the logger and exits the process
 */
export const exitOnNextTick = (code: number): void => {
  logger.loggerEnd();
  process.exit(code);
};
