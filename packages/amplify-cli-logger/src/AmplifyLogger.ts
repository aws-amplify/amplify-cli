import winston, { Logger, format } from 'winston';
import winstonDailyRotateFile from 'winston-daily-rotate-file';
import { constants } from './constants';
import { IAmplifyLogger } from './IAmplifyLogger';
import { getLogFilePath, getLocalLogFilePath } from './getLogFilePath';
import { LocalProjectData, LogPayload, LogErrorPayload } from './Types';

export class AmplifyLogger implements IAmplifyLogger {
  logger: Logger;
  format: winston.Logform.Format;
  localProjectData!: LocalProjectData;
  disabledAmplifyLogging: boolean = !!process.env.AMPLIFY_CLI_DISABLE_LOGGING;

  constructor() {
    this.format = format.combine(format.timestamp(), format.printf(this.formatter));
    this.logger = winston.createLogger();
    if (!this.disabledAmplifyLogging) {
      this.logger.add(
        new winstonDailyRotateFile({
          filename: getLogFilePath(),
          datePattern: constants.DATE_PATTERN,
          maxFiles: `${constants.MAX_FILE_DAYS}d`,
          format: this.format,
        }),
      );
    }
  }

  private formatter(info: winston.Logform.TransformableInfo): string {
    return JSON.stringify(info);
  }

  projectLocalLogInit(projecPath: string): void {
    if (!this.disabledAmplifyLogging) {
      this.logger.add(
        new winstonDailyRotateFile({
          filename: getLocalLogFilePath(projecPath),
          datePattern: constants.DATE_PATTERN,
          maxFiles: `${constants.MAX_FILE_DAYS}d`,
          format: this.format,
        }),
      );
    }
  }

  logInfo(content: LogPayload): void {
    this.logger.info(content.module, { args: content.args });
  }

  logError(content: LogErrorPayload): void {
    const { module, ...others } = content;
    this.logger.error(module, { ...others });
  }

  log(message: string): void {
    this.logger.info(message);
  }
}
