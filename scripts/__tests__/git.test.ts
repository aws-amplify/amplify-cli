import * as execa from 'execa';
import { Git } from '../git';
const mockedExeca: jest.Mocked<typeof execa> = execa as jest.Mocked<typeof execa>;
jest.mock('execa', () => ({
  __esModule: true,
  sync: jest.fn(),
}));

type GitTestCase<T extends keyof Git> = {
  method: T;
  description: string;
  parameters: Parameters<Git[T]>;
  expectedExecaArgs: [string, string[]] | [string, string[], execa.SyncOptions<string>];
  expectedExecaReturnValue?: string;
  expectedReturnValue: ReturnType<Git[T]>;
  expectedExecaError?: Error;
};

describe('git', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  const gitTestCases = [
    <GitTestCase<'isCleanWorkingTree'>>{
      method: 'isCleanWorkingTree',
      description: 'returns false if there is not a clean working tree',
      parameters: [],
      expectedExecaArgs: ['git', ['status', '--porcelain']],
      expectedReturnValue: false,
      expectedExecaReturnValue: 'M  packages/amplify-cli/src/__tests__/git.test.ts',
    },
    <GitTestCase<'isCleanWorkingTree'>>{
      method: 'isCleanWorkingTree',
      description: 'returns true if there is a clean working tree',
      parameters: [],
      expectedExecaArgs: ['git', ['status', '--porcelain']],
      expectedReturnValue: true,
      expectedExecaReturnValue: '',
    },
    <GitTestCase<'getRemoteNameForRepository'>>{
      method: 'getRemoteNameForRepository',
      expectedExecaReturnValue: `origin  git@github.com:someonesfork/amplify-cli.git (push)
upstream  git@github.com:aws-amplify/amplify-cli.git (fetch)`,
      description: 'returns the remote name if it exists',
      parameters: ['aws-amplify/amplify-cli'],
      expectedExecaArgs: ['git', ['remote', '-v']],
      expectedReturnValue: 'upstream',
    },
    <GitTestCase<'getRemoteNameForRepository'>>{
      method: 'getRemoteNameForRepository',
      expectedExecaReturnValue: `origin  git@github.com:anotherpersonsrepository/amplify-cli.git (push)
upstream  git@github.com:someonesrepositoryname/amplify-cli.git (fetch)`,
      description: 'returns undefined if the remote does not exist',
      parameters: ['aws-amplify/amplify-cli'],
      expectedExecaArgs: ['git', ['remote', '-v']],
      expectedReturnValue: undefined,
    },
    <GitTestCase<'getShortSha'>>{
      method: 'getShortSha',
      expectedExecaReturnValue: '123456789011121314',
      description: 'returns the short SHA',
      parameters: [],
      expectedExecaArgs: ['git', ['rev-parse', '--short', 'HEAD']],
      expectedReturnValue: '123456789',
    },
    <GitTestCase<'merge'>>{
      method: 'merge',
      expectedExecaReturnValue: '',
      description: 'merges the branch with the default options',
      parameters: ['branch'],
      expectedExecaArgs: ['git', ['merge', 'branch']],
      expectedReturnValue: undefined,
    },
    <GitTestCase<'merge'>>{
      method: 'merge',
      expectedExecaReturnValue: '',
      description: 'merges the branch with the specified merge message',
      parameters: ['branch', { message: 'merge message' }],
      expectedExecaArgs: ['git', ['merge', 'branch', '-m', '"merge message"']],
      expectedReturnValue: undefined,
    },
    <GitTestCase<'merge'>>{
      method: 'merge',
      expectedExecaReturnValue: '',
      description: 'merges the branch with specified mode',
      parameters: ['branch', { mode: 'ff-only' }],
      expectedExecaArgs: ['git', ['merge', 'branch', '--ff-only']],
      expectedReturnValue: undefined,
    },
    <GitTestCase<'pull'>>{
      method: 'pull',
      expectedExecaReturnValue: '',
      description: 'pulls the branch with the specified remote',
      parameters: ['remote'],
      expectedExecaArgs: ['git', ['pull', 'remote']],
      expectedReturnValue: undefined,
    },
    <GitTestCase<'pull'>>{
      method: 'pull',
      expectedExecaReturnValue: '',
      description: 'pulls the branch from the specified remote and branch',
      parameters: ['remote', 'branch'],
      expectedExecaArgs: ['git', ['pull', 'remote', 'branch']],
      expectedReturnValue: undefined,
    },
    <GitTestCase<'push'>>{
      method: 'push',
      expectedExecaReturnValue: '',
      description: 'pushes the branch to the specified remote and branch',
      parameters: ['remote', 'branch'],
      expectedExecaArgs: ['git', ['push', 'remote', 'branch']],
      expectedReturnValue: undefined,
    },
    <GitTestCase<'fetch'>>{
      method: 'fetch',
      expectedExecaReturnValue: '',
      description: 'fetches the branch from the specified remote and branch',
      parameters: ['remote', 'branch'],
      expectedExecaArgs: ['git', ['fetch', 'remote', 'branch']],
      expectedReturnValue: undefined,
    },
    <GitTestCase<'isExistingBranch'>>{
      method: 'isExistingBranch',
      expectedExecaReturnValue: 'branch1',
      description: 'returns true if the branch exists',
      parameters: ['branch1'],
      expectedExecaArgs: ['git', ['rev-parse', '--verify', 'branch1'], { stdio: 'ignore' }],
      expectedReturnValue: true,
    },
    <GitTestCase<'isExistingBranch'>>{
      method: 'isExistingBranch',
      description: 'returns false if the branch does not exist',
      parameters: ['branch1'],
      expectedExecaArgs: ['git', ['rev-parse', '--verify', 'branch1'], { stdio: 'ignore' }],
      expectedReturnValue: false,
      expectedExecaError: new Error('branch1 does not exist'),
    },
  ];
  test.each(gitTestCases)(
    '$method -> $description',
    async ({ method, parameters = [], expectedExecaArgs, expectedExecaReturnValue, expectedExecaError, expectedReturnValue }) => {
      const git = new Git();
      if (expectedExecaError) {
        mockedExeca.sync = jest.fn().mockImplementation(() => {
          throw expectedExecaError;
        });
      } else {
        mockedExeca.sync = jest.fn().mockReturnValue({ stdout: expectedExecaReturnValue });
      }
      const result = (git[method] as any)(...parameters);
      expect(mockedExeca.sync).toHaveBeenCalledWith(...expectedExecaArgs);
      expect(result).toEqual(expectedReturnValue);
    },
  );
});
