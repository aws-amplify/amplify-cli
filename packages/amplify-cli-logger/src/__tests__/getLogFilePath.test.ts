import path from 'path';
import os from 'os';
import { constants as c } from '../constants';
import { getLogFilePath, getLocalLogFilePath, getLogAuditFilePath, getLocalAuditLogFile } from '../getLogFilePath';

describe('test log file path creation', () => {
  const slash = path.sep;
  const projectPath = 'myProj';
  const homeDir = 'home';

  jest.spyOn(os, 'homedir').mockReturnValue(homeDir);

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('log audit file in a specified directory', () => {
    const result = getLocalAuditLogFile(projectPath);
    const expected = projectPath + slash + c.LOG_DIRECTORY + slash + c.LOG_AUDIT_FOLDER + slash + c.LOG_AUDIT_FILENAME;
    expect(result).toBe(expected);
  });

  it('log file in a specified directory', () => {
    const result = getLocalLogFilePath(projectPath);
    const expected = projectPath + slash + c.LOG_DIRECTORY + slash + c.LOG_FILENAME;
    expect(result).toBe(expected);
  });

  it('log audit file in home directory', () => {
    jest.replaceProperty(process, 'argv', ['node', '']);
    const result = getLogAuditFilePath();
    const expected = homeDir + slash + c.DOT_AMPLIFY + slash + c.LOG_DIRECTORY + slash + c.LOG_AUDIT_FOLDER + slash + c.LOG_AUDIT_FILENAME;
    expect(result).toBe(expected);
  });

  it('log file in home directory', () => {
    jest.replaceProperty(process, 'argv', ['node', '']);
    const result = getLogFilePath();
    const expected = homeDir + slash + c.DOT_AMPLIFY + slash + c.LOG_DIRECTORY + slash + c.LOG_FILENAME;
    expect(result).toBe(expected);
  });

  it('logs-dev folder in home directory for dev build audit file', () => {
    jest.replaceProperty(process, 'argv', ['node', 'dev']);
    const result = getLogAuditFilePath();
    const expected =
      homeDir + slash + c.DOT_AMPLIFY + slash + c.LOG_DIRECTORY + '-dev' + slash + c.LOG_AUDIT_FOLDER + slash + c.LOG_AUDIT_FILENAME;
    expect(result).toBe(expected);
  });

  it('logs-dev folder in home directory for dev build log file', () => {
    jest.replaceProperty(process, 'argv', ['node', 'dev']);
    const result = getLogFilePath();
    const expected = homeDir + slash + c.DOT_AMPLIFY + slash + c.LOG_DIRECTORY + '-dev' + slash + c.LOG_FILENAME;
    expect(result).toBe(expected);
  });
});
