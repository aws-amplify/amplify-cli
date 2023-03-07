import * as rl from 'readline';
import { stdin, stdout } from 'process';
import yargs from 'yargs';
import simpleGit, { SimpleGit } from 'simple-git';
import { GitExtensions } from './git-extensions';

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

export async function prepareBranches(upstreamName: string, devBranch: string, mergeBranch: string, releaseBranch: string, git: SimpleGit) {
  await git.checkout(devBranch);
  await git.pull(upstreamName, devBranch);
  await git.checkout(mergeBranch, ['-b']);
  await git.fetch(upstreamName, releaseBranch);
  await git.mergeFromTo(`${upstreamName}/${releaseBranch}`, mergeBranch, ['-m', 'chore: merge release commit from main to dev']);
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
  const git = simpleGit();
  const gitExtensions = new GitExtensions(git);
  const rlInterface = rl.createInterface({
    input: stdin,
    output: stdout,
  });

  //  if (!(await gitExtensions.isCleanWorkingTree())) {
  //    console.error('Please run the script from a clean working tree');
  //    process.exit(2);
  //  }

  const upstreamName = await gitExtensions.getRemoteNameForRepository(repository);
  if (!upstreamName) {
    console.error('could not find remote name for the aws-amplify/amplify-cli repository');
    process.exit(1);
  }

  console.info(`Fetching ${upstreamName}/${releaseBranch}`);
  await git.fetch(upstreamName, releaseBranch);

  const releaseSha = await gitExtensions.getShortSha(`${upstreamName}/${releaseBranch}`);
  const mergeBranch = mergeBranchArg ?? 'dev-main-merge-' + releaseSha;
  const doesMergeBranchExist = await gitExtensions.isExistingBranch(mergeBranch);

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

  await git.checkout(devBranch);
  await git.pull();
  console.info('Creating merge branch ' + mergeBranch);
  try {
    await git.checkout(['-B', mergeBranch]);
  } catch (e) {
    console.error('Failed to create merge branch, exiting...');
    console.trace(e);
    process.exit(1);
  }

  console.info(`Merging ${upstreamName}/${releaseBranch} into ${mergeBranch}`);
  await git.raw(`merge`, `${upstreamName}/${releaseBranch}`, `-m`, `"chore: merge release commit from main to dev"`, '--no-verify');

  if (!(await gitExtensions.isCleanWorkingTree())) {
    console.info('Resolve merge conflicts and commit merge, then run `yarn run finish-release --continue`');
    process.exit(0);
  }

  await git.push(upstreamName, mergeBranch);
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
