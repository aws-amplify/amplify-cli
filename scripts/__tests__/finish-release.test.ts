import * as finishRelease from '../finish-release';

import * as childProcess from 'child_process';
const { Git, extractUpstreamNameFromRemotes } = finishRelease;

jest.mock('child_process', () => {
  return {
    __esModule: true,
    execSync: () => '',
  };
});

const mockedChildProcess: jest.Mocked<typeof childProcess> = childProcess as jest.Mocked<typeof childProcess>;

const REPO_NAME = 'aws-amplify/amplify-cli';
describe('when finding the remote name', () => {
  test('if a remote with the repository name exists in the input, remote name returns the first column', () => {
    expect(
      extractUpstreamNameFromRemotes(
        `origin  git@github.com:someonesfork/amplify-cli.git (push)
upstream        git@github.com:aws-amplify/amplify-cli.git (fetch)`,
        REPO_NAME,
      ),
    ).toEqual('upstream');
  });
  test('if a remote with the repository name does not exist, undefined is returned', () => {
    expect(
      extractUpstreamNameFromRemotes(
        `origin  git@github.com:anotherpersonsrepository/amplify-cli.git (push)
upstream        git@github.com:someonesrepositoryname/amplify-cli.git (fetch)`,
        REPO_NAME,
      ),
    ).toEqual(undefined);
  });
});

describe('isCleanWorkingTree', () => {
  test('returns false if there is not a clean working tree', () => {
    const git = new Git();
    mockedChildProcess.execSync = jest.fn().mockReturnValue('a changed file');
    const result = git.isCleanWorkingTree();
    expect(mockedChildProcess.execSync).toHaveBeenCalledWith('git status --porcelain');
    expect(result).toBeFalsy();
  });
  test('returns true if there is a clean working tree', () => {
    const git = new Git();
    mockedChildProcess.execSync = jest.fn().mockReturnValue('');
    const result = git.isCleanWorkingTree();
    expect(mockedChildProcess.execSync).toHaveBeenCalledWith('git status --porcelain');
    expect(result).toBeTruthy();
  });
});
