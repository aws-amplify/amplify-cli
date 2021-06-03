import fs from 'fs-extra';
import { checkCaseSensitivityIssue } from '../../../../provider-utils/awscloudformation/utils/check-case-sensitivity';

const mockExit = jest.spyOn(process, 'exit').mockImplementation();
jest.spyOn(fs, 'readdir').mockImplementation(_ => new Promise(resolve => resolve(['testBlog', 'testblogcasesensitivefs'])));

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

test('conflict exists if names are different by case only', async () => {
  await checkCaseSensitivityIssue(contextStub, 'api', 'testblog');
  expect(mockExit).toBeCalledTimes(1);
  mockExit.mockRestore();
});
