import os from 'os';
import path from 'path';
import { constants } from '../constants';
import { getLogDirectory, getLocalLogFileDirectory } from '../baseLogFilePath';

describe('test base path creation', () => {
  const slash = path.sep;

  jest.spyOn(os, 'homedir').mockReturnValue('home');

  afterAll(() => {
    jest.clearAllMocks();
  });

  it('should create path for logs folder in a specified directory', () => {
    const result = getLocalLogFileDirectory('myProj');
    expect(result).toBe('myProj' + slash + constants.LOG_DIRECTORY);
  });

  it('should create path for logs-dev folder in home directory for dev build', () => {
    process.argv = ['node', 'dev'];
    const result = getLogDirectory();
    expect(result).toBe('home' + slash + constants.DOT_AMPLIFY + slash + constants.LOG_DIRECTORY + '-dev');
  });

  it('should create path for logs folder in home directory', () => {
    process.argv = ['node', ''];
    const result = getLogDirectory();
    expect(result).toBe('home' + slash + constants.DOT_AMPLIFY + slash + constants.LOG_DIRECTORY);
  });
});
