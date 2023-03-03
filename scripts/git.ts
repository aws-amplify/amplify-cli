import { execSync } from 'child_process';

export interface MergeOptions {
  message: string;
  mode: 'ff-only';
}
export class Git {
  remote = (verbose?: boolean): string => {
    let command = ['git', 'remote'];
    if (verbose) {
      command.push('-v');
    }
    return execSync(command.join(' ')).toString();
  };

  isExistingBranch(branch: string): boolean {
    const command = ['git', 'rev-parse', '--verify', branch];
    try {
      execSync(command.join(' '), { stdio: 'ignore' });
      return true;
    } catch (e) {
      return false;
    }
  }

  getShortSha(ref: string = 'HEAD'): string {
    const command = ['git', 'rev-parse', '--short', ref];
    return execSync(command.join(' ')).toString().trim();
  }

  deleteBranch(branch: string) {
    let command = ['git', 'branch', '-D', branch];
    execSync(command.join(' '));
  }

  pull(remote?: string, branch?: string) {
    let command = ['git', 'pull'];
    if (remote) {
      command.push(remote);
      if (branch) {
        command.push(branch);
      }
    }
    execSync(command.join(' '));
  }

  checkout(branch: string, create: boolean = false): void {
    const command = ['git', 'checkout'];
    if (create) {
      command.push('-b');
    }
    command.push(branch);
    execSync(command.join(' '));
  }

  merge(branch: string, options: Partial<MergeOptions> = {}): void {
    const command = ['git', 'merge', branch];
    if (options.message) {
      command.push('-m');
      command.push(`"${options.message}"`);
    }
    if (options.mode) {
      command.push(`--${options.mode}`);
    }
    execSync(command.join(' '));
  }

  push(remote: string, branch: string) {
    const command = ['git', 'push', remote, branch];
    execSync(command.join(' '));
  }

  fetch(remote: string, branch?: string) {
    const command = ['git', 'fetch', remote];
    if (branch) {
      command.push(branch);
    }
    execSync(command.join(' '));
  }

  isCleanWorkingTree(): boolean {
    const buffer = execSync('git status --porcelain');
    return !buffer.toString().trim();
  }

  getRemoteNameForRepository = (repository: string): string | undefined => {
    const remoteOutput = this.remote(true);
    const lineWithRepoName = remoteOutput.split('\n').find((l) => l.indexOf(repository) > -1);
    return lineWithRepoName?.split(/\s/)?.[0];
  };
}
