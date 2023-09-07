import * as execa from 'execa';
import * as rl from 'readline';
import { stdin, stdout } from 'process';
import yargs from 'yargs';

export function extractUpstreamNameFromRemotes(remoteGitVerbose: string, upstreamRepositoryName: string): string | undefined {
  const lineWithRepoName = remoteGitVerbose.split('\n').find((l) => l.indexOf(upstreamRepositoryName) > -1);
  return lineWithRepoName?.split(/\s/)?.[0];
}

export interface MergeOptions {
  message: string;
  mode: 'ff-only';
}
export class Git {
  remote(verbose?: boolean): string {
    let command = ['git', 'remote'];
    if (verbose) {
      command.push('-v');
    }
    return execa.sync(command[0], command.slice(1)).stdout;
  }

  isExistingBranch(branch: string): boolean {
    const command = ['git', 'rev-parse', '--verify', branch];
    try {
      execa.sync(command[0], command.slice(1), { stdio: 'ignore' });
      return true;
    } catch (e) {
      return false;
    }
  }

  getShortSha(ref: string = 'HEAD'): string {
    const command = ['git', 'rev-parse', '--short=15', ref];
    return execa.sync(command[0], command.slice(1)).stdout.trim();
  }

  deleteBranch(branch: string) {
    let command = ['git', 'branch', '-D', branch];
    execa.sync(command[0], command.slice(1));
  }

  pull(remote?: string, branch?: string) {
    let command = ['git', 'pull'];
    if (remote) {
      command.push(remote);
      if (branch) {
        command.push(branch);
      }
    }
    execa.sync(command[0], command.slice(1));
  }

  checkout(branch: string, create: boolean = false): void {
    const command = ['git', 'checkout'];
    if (create) {
      command.push('-b');
    }
    command.push(branch);
    execa.sync(command[0], command.slice(1));
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
    execa.sync(command[0], command.slice(1));
  }

  push(remote: string, branch: string) {
    const command = ['git', 'push', remote, branch];
    execa.sync(command[0], command.slice(1));
  }

  fetch(remote: string, branch?: string) {
    const command = ['git', 'fetch', remote];
    if (branch) {
      command.push(branch);
    }
    execa.sync(command[0], command.slice(1));
  }

  isCleanWorkingTree(): boolean {
    const buffer = execa.sync('git', ['status', '--porcelain']);
    return !buffer.stdout.trim();
  }
}

export async function shouldContinue(read: rl.Interface, prompt: string): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    read.question(`${prompt}\nContinue? (y/n) `, (answer) => {
      if (answer.toLowerCase().trim() === 'y') {
        resolve(true);
      } else {
        resolve(false);
      }
    });
  });
}

function generatePRTemplate(mergeBranch: string, releaseBranch: string, devBranch: string): string {
  return `
Release PR for ${mergeBranch}.

## This PR must be merged using "Create a merge commit" option.

This PR merges ${releaseBranch} into ${devBranch}.
`;
}

export function getCompareLink(
  repository: string,
  releaseBranch: string,
  devBranch: string,
  mergeBranch: string,
  pullRequestBody: string,
): string {
  const parameters = {
    title: `chore(release): Merge ${releaseBranch} into ${devBranch}`,
    labels: 'release',
    body: pullRequestBody,
  };
  const parameterString = Object.entries(parameters)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
  return `https://github.com/${repository}/compare/${devBranch}...${mergeBranch}?${parameterString}`;
}

export function prepareBranches(upstreamName: string, devBranch: string, mergeBranch: string, releaseBranch: string, git: Git) {
  git.checkout(devBranch);
  git.pull(upstreamName, devBranch);
  git.checkout(mergeBranch, true);
  git.fetch(upstreamName, releaseBranch);
  git.merge(`${upstreamName}/${releaseBranch}`, { message: 'chore: merge release commit from main to dev' });
}
type Args = {
  continue: boolean;
  releaseBranch: string;
  mergeBranch?: string;
  devBranch: string;
  repository: string;
};
async function getArgs(): Promise<Args> {
  const args = await yargs(process.argv.slice(2))
    .string('release-branch')
    .default('release-branch', 'main')
    .string('dev-branch')
    .default('dev-branch', 'dev')
    .string('repository')
    .default('repository', 'aws-amplify/amplify-cli')
    .boolean('continue')
    .default('continue', false)
    .string('merge-branch').argv;
  return {
    continue: args.continue,
    releaseBranch: args['release-branch'],
    devBranch: args['dev-branch'],
    mergeBranch: args['merge-branch'],
    repository: args.repository,
  };
}

export async function main() {
  const { continue: continueArg, releaseBranch, devBranch, repository, mergeBranch: mergeBranchArg } = await getArgs();
  const git = new Git();
  const rlInterface = rl.createInterface({
    input: stdin,
    output: stdout,
  });

  if (!git.isCleanWorkingTree()) {
    console.error('Please run the script from a clean working tree');
    process.exit(2);
  }

  const remoteOutput = git.remote(true);
  const upstreamName = extractUpstreamNameFromRemotes(remoteOutput, repository);
  if (!upstreamName) {
    console.error('could not find remote name for the aws-amplify/amplify-cli repository');
    process.exit(1);
  }

  console.info(`Fetching ${upstreamName}/${releaseBranch}`);
  git.fetch(upstreamName, releaseBranch);

  const releaseSha = git.getShortSha(`${upstreamName}/${releaseBranch}`);
  const mergeBranch = mergeBranchArg ?? 'dev-main-merge-' + releaseSha;
  const doesMergeBranchExist = git.isExistingBranch(mergeBranch);

  if (!continueArg && doesMergeBranchExist) {
    console.error(
      `The merge branch \`${mergeBranch}\` already exists. Please delete the merge branch and try again, or run the script with \`--continue\``,
    );
    process.exit(1);
  }
  const canContinue = continueArg || (await shouldContinue(rlInterface, `This will create the merge branch \`${mergeBranch}\`.`));
  if (!canContinue) {
    console.info('Exiting...');
    process.exit(0);
  }

  git.checkout(devBranch);
  git.pull();
  console.info('Creating merge branch ' + mergeBranch);
  try {
    const shouldAttemptCreate = !doesMergeBranchExist;
    git.checkout(mergeBranch, shouldAttemptCreate);
  } catch (e) {
    console.error('Failed to create merge branch, exiting...');
    process.exit(1);
  }

  console.info(`Merging ${upstreamName}/${releaseBranch} into ${mergeBranch}`);
  try {
    git.merge(`${upstreamName}/${releaseBranch}`, { message: 'chore: merge release commit from main to dev' });
  } catch (e) {
    console.info(
      'Resolve merge conflicts and then finish the merge using `git merge --continue`.\nThen run `yarn finish-release --continue`',
    );
    process.exit(0);
  }

  git.push(upstreamName, mergeBranch);
  const prBody = generatePRTemplate(mergeBranch, releaseBranch, devBranch);

  console.info(`
You can compare changes between the branches here: ${getCompareLink(
    repository,
    releaseBranch,
    devBranch,
    mergeBranch,
    prBody,
  )}.\n\nTo finish the release, use the link above to open a pull request.`);

  process.exit(0);
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
