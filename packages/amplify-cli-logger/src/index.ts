import { AmplifyLogger } from './AmplifyLogger';
import { IAmplifyLogger } from './IAmplifyLogger';
import { constants } from './constants';
export { Redactor } from './Redactor';
export const logger: IAmplifyLogger = new AmplifyLogger();
export const LocalLogDirectory = constants.LOG_DIRECTORY;
