import winston from 'winston';
import winstonDailyRotateFile from 'winston-daily-rotate-file';
import * as logFilePath from '../getLogFilePath';
import { constants } from '../constants';

describe('test amplify logger', () => {
  let amplifyLogger;
  const logger = {
    add: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  };
  const winstonLogger = {
    createLogger: jest.fn().mockReturnValue(logger),
    format: {
      combine: jest.fn(),
      timestamp: jest.fn(),
      splat: jest.fn(),
      printf: jest.fn(),
    },
    transports: {
      Console: jest.fn(),
    },
  };
  const wdrfMock = jest.fn();
  beforeAll(() => {
    jest.mock('winston', () => winstonLogger);
    jest.mock('winston-daily-rotate-file', () => wdrfMock);
  });
  afterAll(() => {
    jest.clearAllMocks();
  });

  it('winston logger', () => {
    expect(winston).toBeDefined();
    expect(winstonDailyRotateFile).toBeDefined;
  });

  it('case log info', () => {
    const { AmplifyLogger } = require('../AmplifyLogger');
    amplifyLogger = new AmplifyLogger();
    const messagePayload = { message: 'Logging this' };
    amplifyLogger.logInfo(messagePayload);
    expect(logger.info).toBeCalledWith(messagePayload.message, {});
    expect(logger.add).toBeCalled();
  });

  it('case: log error', () => {
    const { AmplifyLogger } = require('../AmplifyLogger');
    amplifyLogger = new AmplifyLogger();
    const errorPayload = { error: new Error('some Error'), message: 'Some Error has occurent' };
    amplifyLogger.logError(errorPayload);
    expect(logger.error).toBeCalledWith(errorPayload.message, { error: errorPayload.error });
  });

  it('case: test constants', () => {
    const { AmplifyLogger } = require('../AmplifyLogger');
    amplifyLogger = new AmplifyLogger();
    expect(wdrfMock).toBeCalledWith({
      auditFile: logFilePath.getLogAuditFilePath(),
      filename: logFilePath.getLogFilePath(),
      datePattern: constants.DATE_PATTERN,
      maxFiles: constants.MAX_FILE_DAYS,
      handleExceptions: false,
      format: amplifyLogger.format,
    });
    const path = './somepath';
    amplifyLogger.projectLocalLogInit(path);
    expect(logger.add).toBeCalled();
    expect(wdrfMock).toBeCalledWith({
      auditFile: logFilePath.getLocalAuditLogFile(path),
      filename: logFilePath.getLocalLogFilePath(path),
      datePattern: constants.DATE_PATTERN,
      maxFiles: constants.MAX_FILE_DAYS,
      handleExceptions: false,
      format: amplifyLogger.format,
    });
  });

  it('case initialize logging with disable true', () => {
    wdrfMock.mockClear();
    process.env['AMPLIFY_CLI_DISABLE_LOGGING'] = 'true';
    const { AmplifyLogger } = require('../AmplifyLogger');
    amplifyLogger = new AmplifyLogger();
    expect(winstonLogger.transports.Console).toBeCalledWith({ silent: true });
    expect(wdrfMock).not.toBeCalled();
    delete process.env['AMPLIFY_CLI_DISABLE_LOGGING'];
  });
});
