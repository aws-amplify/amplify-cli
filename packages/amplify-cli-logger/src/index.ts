import { AmplifyLogger } from './AmplifyLogger';
import { IAmplifyLogger } from './IAmplifyLogger';
import { constants } from './constants';

export { Redactor, stringMasker } from './Redactor';

export const LocalLogDirectory = constants.LOG_DIRECTORY;
let logger: IAmplifyLogger| undefined;

/**
 * Get the logger instance
 */
export const getAmplifyLogger = (): IAmplifyLogger => {
  if (!logger) {
    logger = new AmplifyLogger();
  }
  return logger;
};
