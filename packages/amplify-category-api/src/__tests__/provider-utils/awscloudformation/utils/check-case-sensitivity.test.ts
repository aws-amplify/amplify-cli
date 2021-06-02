import fs from 'fs-extra';
import { checkCaseSensitivityIssue } from '../../../../provider-utils/awscloudformation/utils/check-case-sensitivity';

const mockExit = jest.spyOn(process, 'exit').mockImplementation();
jest.spyOn(fs, 'writeFile').mockImplementation(_ => new Promise(resolve => resolve(true)));
jest.spyOn(fs, 'unlink').mockImplementation(_ => new Promise(resolve => resolve()));
jest.spyOn(fs, 'readdir').mockImplementation(_ => new Promise(resolve => resolve(['testBlog', 'testblogcasesensitivefs'])));
jest.spyOn(fs, 'existsSync').mockImplementation(_ => true);

const contextStub = {
  amplify: {
    pathManager: {
      getBackendDirPath: jest.fn(_ => 'mock/backend/path'),
    },
  },
  print: {
    error: jest.fn(),
  },
};

test('conflict does not exist if the name matches exactly', async () => {
  await checkCaseSensitivityIssue(contextStub, 'api', 'testBlog');
  expect(mockExit).toBeCalledTimes(0);
});

test('conflict does not exist if names do not match whatsoever', async () => {
  await checkCaseSensitivityIssue(contextStub, 'api', 'newname');
  expect(mockExit).toBeCalledTimes(0);
});

test('conflict exists if fs is case insensitive and names are different by case only', async () => {
  await checkCaseSensitivityIssue(contextStub, 'api', 'testblog');
  expect(mockExit).toBeCalledTimes(1);
  mockExit.mockRestore();
});

test('conflict does not exist if file system is case sensitive', async () => {
  jest.spyOn(fs, 'existsSync').mockImplementation(_ => false);
  await checkCaseSensitivityIssue(contextStub, 'api', 'testBlogCaseSensitiveFS');
  expect(mockExit).toBeCalledTimes(0);
});
