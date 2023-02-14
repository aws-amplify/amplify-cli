import winston, { Logger, format } from 'winston';
import * as os from 'os';
import winstonDailyRotateFile from 'winston-daily-rotate-file';
import { constants } from './constants';
import { IAmplifyLogger } from './IAmplifyLogger';
import { getLogFilePath, getLocalLogFilePath, getLogAuditFilePath, getLocalAuditLogFile } from './getLogFilePath';
import { LogPayload, LogErrorPayload } from './Types';
const { combine, timestamp, splat, printf } = format;
export class AmplifyLogger implements IAmplifyLogger {
  logger: Logger;
  loggerFormat: winston.Logform.Format;
  disabledAmplifyLogging: boolean = process.env.AMPLIFY_CLI_DISABLE_LOGGING === 'true';
  constructor() {
    this.logger = winston.createLogger();
    this.loggerFormat = combine(timestamp(), splat(), printf(this.formatter));
    if (!this.disabledAmplifyLogging) {
      this.logger.add(
        new winstonDailyRotateFile({
          auditFile: getLogAuditFilePath(),
          filename: getLogFilePath(),
          datePattern: constants.DATE_PATTERN,
          maxFiles: constants.MAX_FILE_DAYS,
          handleExceptions: false,
          format: this.loggerFormat,
        }),
      );
    } else {
      this.logger.add(
        new winston.transports.Console({
          silent: true,
        }),
      );
    }
  }

  loggerEnd(): void {
    this.logger.end();
  }

  private formatter(info: winston.Logform.TransformableInfo): string {
    const format = `${info.timestamp}|${info.level} : ${info.message}`;
    if (info.level === 'error') {
      return `${format}${os.EOL}${info.error}`;
    }

    return format;
  }

  projectLocalLogInit(projectPath: string): void {
    if (!this.disabledAmplifyLogging) {
      this.logger.add(
        new winstonDailyRotateFile({
          auditFile: getLocalAuditLogFile(projectPath),
          filename: getLocalLogFilePath(projectPath),
          datePattern: constants.DATE_PATTERN,
          maxFiles: constants.MAX_FILE_DAYS,
          handleExceptions: false,
          format: this.loggerFormat,
        }),
      );
    }
  }

  logInfo(content: LogPayload): void {
    const { message, ...others } = content;
    this.logger.info(message, { ...others });
  }

  logError(content: LogErrorPayload): void {
    const { message, ...others } = content;
    this.logger.error(message, { ...others });
  }
}
