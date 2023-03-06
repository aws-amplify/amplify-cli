import * as rl from 'readline';
import { Git } from './git';
import { stdin, stdout } from 'process';
import yargs from 'yargs';

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
function getArgs(): Args {
  const args = yargs(process.argv.slice(2))
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
  const { continue: continueArg, releaseBranch, devBranch, repository, mergeBranch: mergeBranchArg } = getArgs();
  const git = new Git();
  const rlInterface = rl.createInterface({
    input: stdin,
    output: stdout,
  });

  if (!git.isCleanWorkingTree()) {
    console.error('Please run the script from a clean working tree');
    process.exit(2);
  }

  const upstreamName = git.getRemoteNameForRepository(repository);
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
  git.merge(`${upstreamName}/${releaseBranch}`, { message: 'chore: merge release commit from main to dev' });

  if (!git.isCleanWorkingTree()) {
    console.info('Resolve merge conflicts and commit merge, then run `yarn run finish-release --continue`');
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
