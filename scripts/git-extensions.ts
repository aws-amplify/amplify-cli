import { SimpleGit } from 'simple-git';

export class GitExtensions {
  private simpleGit: SimpleGit;
  constructor(simpleGit: SimpleGit) {
    this.simpleGit = simpleGit;
  }

  isExistingBranch = async (branch: string): Promise<boolean> => {
    try {
      await this.simpleGit.revparse(['--verify', branch]);
      return true;
    } catch (e) {
      return false;
    }
  };

  getShortSha = (ref: string = 'HEAD'): Promise<string> => {
    return this.simpleGit.revparse(['--short', ref]);
  };

  isCleanWorkingTree = async (): Promise<boolean> => {
    const status = await this.simpleGit.status();
    return status.isClean();
  };

  getRemoteNameForRepository = async (repository: string): Promise<string | undefined> => {
    const result = await this.simpleGit.remote(['-v']);
    if (!result) {
      return undefined;
    }
    const lineWithRepoName = result?.split('\n').find((l) => l.indexOf(repository) > -1);
    return lineWithRepoName?.split(/\s/)?.[0];
  };
}
