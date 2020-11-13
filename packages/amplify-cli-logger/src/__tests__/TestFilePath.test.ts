import os from 'os';
import path from 'path';
import { constants } from '../constants';

describe('test path creation', () => {
  const localPath = 'myProj';
  const join = jest.spyOn(path, 'join');
  const localLogDirectory = 'localLogDirectory';
  const logDirectory = 'logDirectory';
  jest.mock('../baseLogFilePath', () => ({
    getLocalLogFileDirectory: jest.fn().mockReturnValue(localLogDirectory),
    getLogDirectory: jest.fn().mockReturnValue(logDirectory),
  }));
  afterAll(() => {
    jest.clearAllMocks();
  });
  it('case: getLocalAuditLogFile', () => {
    require('../getLogFilePath').getLocalAuditLogFile(localPath);
    expect(join).toBeCalledWith(localLogDirectory, constants.LOG_AUDIT_FOLDER, constants.LOG_AUDIT_FILENAME);
  });
  it('case: getLocalLogFilePath', () => {
    require('../getLogFilePath').getLocalLogFilePath(localPath);
    expect(join).toBeCalledWith(localLogDirectory, constants.LOG_FILENAME);
  });

  it('case: getLogAuditFilePath', () => {
    require('../getLogFilePath').getLogAuditFilePath();
    expect(join).toBeCalledWith(logDirectory, constants.LOG_AUDIT_FOLDER, constants.LOG_AUDIT_FILENAME);
  });

  it('case: getLogFilePath', () => {
    require('../getLogFilePath').getLogFilePath();
    expect(join).toBeCalledWith(logDirectory, constants.LOG_FILENAME);
  });
});
