import { getVersionFromArgs, releasesRequest, semverToGithubTag } from './github-common';
import { join } from 'path';

/**
 * This function expects a pre-release of 'version' to already exist
 * The 'pre-release' flag of the release is turned off (thus making it the latest release)
 */
const publishRelease = async (version: string) => {
  const { id: releaseId } = await releasesRequest(join('tags', semverToGithubTag(version)));
  const releaseIdStr = (releaseId as number).toString();
  console.log('Publishing release');
  await releasesRequest(releaseIdStr, {
    method: 'PATCH',
    body: JSON.stringify({
      prerelease: false,
    }),
  });
};

const main = async () => {
  const version = getVersionFromArgs();
  await publishRelease(version);
};

main();
