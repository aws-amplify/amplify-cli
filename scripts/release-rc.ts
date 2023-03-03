import yargs from 'yargs';
import { Git } from './git';
export interface Args {
  rcSha: string;
  repository: string;
  releaseBranch: string;
  continue: boolean;
}
function getArgs(): Args {
  const args = yargs(process.argv.slice(2))
    .option('repository', {
      type: 'string',
      description: 'The name of the upstream repository',
      default: 'aws-amplify/amplify-cli',
    })
    .option('release-branch', {
      type: 'string',
      description: 'The name of the release branch',
      default: 'main',
    })
    .option('continue', {
      type: 'boolean',
      description: 'Continue the release process',
      default: false,
      demandOption: false,
    })
    .option('rc-sha', {
      type: 'string',
      description: 'The sha of the release candidate',
      demandOption: true,
    })
    .help()
    .alias('help', 'h').argv;
  return {
    rcSha: args['rc-sha'],
    repository: args.repository,
    releaseBranch: args['release-branch'],
    continue: args.continue,
  };
}
async function main() {
  try {
    const git = new Git();
    const { rcSha, repository, releaseBranch, continue: continueArg } = getArgs();
    if (!rcSha) {
      throw new Error('RC SHA is required');
    }
    if (!repository) {
      throw new Error('Repository is required');
    }
    const upstream = git.getRemoteNameForRepository(repository);
    if (!upstream) {
      throw new Error(`Could not find remote for repository ${repository}`);
    }
    const shortSha = git.getShortSha(rcSha);
    git.getRemoteNameForRepository(repository);
    const rcReleaseBranchName = `release_rc/${shortSha}`;
    const shouldAttemptCreate = !continueArg;
    git.checkout(rcReleaseBranchName, shouldAttemptCreate, { startPoint: shortSha });
    git.fetch(upstream, releaseBranch);
    git.merge(`${upstream}/${releaseBranch}`);
    if (!git.isCleanWorkingTree()) {
      console.info('Resolve merge conflicts and continue merge, then run `yarn run release-rc --continue`');
      process.exit(0);
    }
    git.push(upstream, rcReleaseBranchName);
    console.info('CircleCI is publishing the release candidate. Check progress at');
    console.info(`https://app.circleci.com/pipelines/github/${repository}?branch=${rcReleaseBranchName}`);
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
