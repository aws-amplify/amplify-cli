import { getArgs, releasesRequest, semverToGithubTag } from './github-common';
import { join } from 'path';

/**
 * This function expects a pre-release of 'version' to already exist
 * The 'pre-release' flag of the release is turned off (thus making it the latest release)
 */
const publishRelease = async (version: string, commit: string) => {
  const { id: releaseId } = await releasesRequest(join('tags', semverToGithubTag(version)));
  const releaseIdStr = (releaseId as number).toString();
  console.log('Publishing release');
  await releasesRequest(releaseIdStr, {
    method: 'PATCH',
    body: JSON.stringify({
      prerelease: false,
      make_latest: 'true',
      target_commitish: commit,
    }),
  });
};

const main = async () => {
  const { version, commit } = getArgs();
  await publishRelease(version, commit);
};

main();
