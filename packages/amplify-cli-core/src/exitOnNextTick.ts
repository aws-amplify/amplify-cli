import { getAmplifyLogger } from '@aws-amplify/amplify-cli-logger';

/**
 * closes the logger and exits the process
 */
export const exitOnNextTick = (code: number): void => {
  getAmplifyLogger().loggerEnd();
  process.exit(code);
};
