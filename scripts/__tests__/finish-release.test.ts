import * as finishRelease from '../finish-release';

import * as execa from 'execa';
const { Git, extractUpstreamNameFromRemotes } = finishRelease;

jest.mock('execa', () => ({
  __esModule: true,
  sync: jest.fn(),
}));

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
    const syncSpy = jest
      .spyOn(execa, 'sync')
      .mockReturnValue({ stdout: 'a changed file' } as unknown as execa.ExecaSyncReturnValue<Buffer>);
    const result = git.isCleanWorkingTree();
    expect(syncSpy).toHaveBeenCalledWith('git', ['status', '--porcelain']);
    expect(result).toBeFalsy();
  });
  test('returns true if there is a clean working tree', () => {
    const git = new Git();
    const syncSpy = jest.spyOn(execa, 'sync').mockReturnValue({ stdout: '' } as unknown as execa.ExecaSyncReturnValue<Buffer>);
    const result = git.isCleanWorkingTree();
    expect(syncSpy).toHaveBeenCalledWith('git', ['status', '--porcelain']);
    expect(result).toBeTruthy();
  });
});
