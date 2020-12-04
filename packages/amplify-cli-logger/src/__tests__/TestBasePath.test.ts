import os from 'os';
import path from 'path';
import { constants } from '../constants';

describe('test base path creation', () => {
  const homedirectory = 'home';
  const localPath = 'myProj';

  const homedir = jest.spyOn(os, 'homedir').mockReturnValue(homedirectory);
  const join = jest.spyOn(path, 'join');

  afterAll(() => {
    jest.clearAllMocks();
  });

  it('case: getLocalAuditLogFile', () => {
    require('../baseLogFilePath').getLocalLogFileDirectory(localPath);
    expect(join).toBeCalledWith(localPath, constants.LOG_DIRECTORY);
  });

  it('case: getLogAuditFilePath', () => {
    process.argv = ['node', 'dev'];
    require('../baseLogFilePath').getLogDirectory();
    expect(homedir).toBeCalled();
    expect(join).toBeCalledWith(homedirectory, constants.DOT_AMPLIFY, constants.LOG_DIRECTORY + '-dev');
  });

  it('case: getLogFilePath', () => {
    process.argv = ['node', ''];
    require('../baseLogFilePath').getLogDirectory();
    expect(homedir).toBeCalled();
    expect(join).toBeCalledWith(homedirectory, constants.DOT_AMPLIFY, constants.LOG_DIRECTORY);
  });
});
