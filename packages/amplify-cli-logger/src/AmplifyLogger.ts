import winston, { Logger, format } from 'winston';
import * as os from 'os';
import winstonDailyRotateFile from 'winston-daily-rotate-file';
import { constants } from './constants';
import { IAmplifyLogger } from './IAmplifyLogger';
import { getLogFilePath, getLocalLogFilePath, getLogAuditFilePath, getLocalAuditLogFile } from './getLogFilePath';
import { LocalProjectData, LogPayload, LogErrorPayload } from './Types';

export class AmplifyLogger implements IAmplifyLogger {
  logger: Logger;
  format: winston.Logform.Format;
  localProjectData!: LocalProjectData;
  disabledAmplifyLogging: boolean = !!process.env.AMPLIFY_CLI_DISABLE_LOGGING;
  constructor() {
    this.logger = winston.createLogger();
    this.format = format.combine(format.timestamp(), format.splat(), format.printf(this.formatter));
    if (!this.disabledAmplifyLogging) {
      this.logger.add(
        new winstonDailyRotateFile({
          auditFile: getLogAuditFilePath(),
          filename: getLogFilePath(),
          datePattern: constants.DATE_PATTERN,
          maxFiles: constants.MAX_FILE_DAYS,
          handleExceptions: false,
          format: this.format,
        }),
      );
    }
  }

  private formatter(info: winston.Logform.TransformableInfo): string {
    const format = `${info.timestamp}|${info.level} : ${info.message}`;
    if (info.level === 'error') {
      return `${format}${os.EOL}${info.error}`;
    }

    return format;
  }

  projectLocalLogInit(projecPath: string): void {
    if (!this.disabledAmplifyLogging) {
      this.logger.add(
        new winstonDailyRotateFile({
          auditFile: getLocalAuditLogFile(projecPath),
          filename: getLocalLogFilePath(projecPath),
          datePattern: constants.DATE_PATTERN,
          maxFiles: constants.MAX_FILE_DAYS,
          handleExceptions: false,
          format: this.format,
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
