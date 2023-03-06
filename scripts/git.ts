import { sync } from 'execa';

export interface MergeOptions {
  message: string;
  mode: 'ff-only';
}

export interface CheckoutOptions {
  startPoint?: string;
}
export class Git {
  private git = 'git';
  remote = (verbose?: boolean): string => {
    const args = ['remote'];
    if (verbose) {
      args.push('-v');
    }
    return sync(this.git, args).stdout.toString();
  };

  isExistingBranch = (branch: string): boolean => {
    const args = ['rev-parse', '--verify', branch];
    try {
      sync(this.git, args, { stdio: 'ignore' });
      return true;
    } catch (e) {
      return false;
    }
  };

  getShortSha = (ref: string = 'HEAD'): string => {
    const args = ['rev-parse', '--short', ref];
    return sync(this.git, args).stdout.toString().trim().slice(0, 9);
  };

  deleteBranch = (branch: string) => {
    let args = ['branch', '-D', branch];
    sync(this.git, args);
  };

  pull = (remote?: string, branch?: string) => {
    let args = ['pull'];
    if (remote) {
      args.push(remote);
      if (branch) {
        args.push(branch);
      }
    }
    sync(this.git, args);
  };

  checkout = (branch: string, create: boolean = false, options: CheckoutOptions = {}): void => {
    const { startPoint } = options;
    const args = ['checkout'];
    if (create) {
      args.push('-b');
    }
    args.push(branch);
    if (create && startPoint) {
      args.push(startPoint);
    }
    sync(this.git, args);
  };

  merge = (branch: string, options: Partial<MergeOptions> = {}): void => {
    const args = ['merge', branch];
    if (options.message) {
      args.push('-m');
      args.push(`"${options.message}"`);
    }
    if (options.mode) {
      args.push(`--${options.mode}`);
    }
    sync(this.git, args);
  };

  push = (remote: string, branch: string) => {
    const args = ['push', remote, branch];
    sync(this.git, args);
  };

  fetch = (remote: string, branch?: string) => {
    const args = ['fetch', remote];
    if (branch) {
      args.push(branch);
    }
    sync(this.git, args);
  };

  isCleanWorkingTree = (): boolean => {
    const args = ['status', '--porcelain'];
    return sync(this.git, args).stdout.toString().trim() === '';
  };

  getRemoteNameForRepository = (repository: string): string | undefined => {
    const remoteOutput = this.remote(true);
    const lineWithRepoName = remoteOutput.split('\n').find((l) => l.indexOf(repository) > -1);
    return lineWithRepoName?.split(/\s/)?.[0];
  };
}
