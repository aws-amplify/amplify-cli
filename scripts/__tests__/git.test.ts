import * as childProcess from 'child_process';
import { Git } from '../git';
const mockedChildProcess: jest.Mocked<typeof childProcess> = childProcess as jest.Mocked<typeof childProcess>;
jest.mock('child_process', () => ({
  __esModule: true,
  execSync: jest.fn(),
}));
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
const REPO_NAME = 'aws-amplify/amplify-cli';
describe('when finding the remote name', () => {
  test('if a remote with the repository name exists in the input, remote name returns the first column', () => {
    const git = new Git();
    jest.spyOn(git, 'remote').mockReturnValue(
      `origin  git@github.com:someonesfork/amplify-cli.git (push)
upstream  git@github.com:aws-amplify/amplify-cli.git (fetch)`,
    );
    expect(git.getRemoteNameForRepository(REPO_NAME)).toEqual('upstream');
  });
  test('if a remote with the repository name does not exist, undefined is returned', () => {
    const git = new Git();
    jest.spyOn(git, 'remote').mockReturnValue(
      `origin  git@github.com:anotherpersonsrepository/amplify-cli.git (push)
upstream  git@github.com:someonesrepositoryname/amplify-cli.git (fetch)`,
    );
    expect(git.getRemoteNameForRepository(REPO_NAME)).toEqual(undefined);
  });
});
