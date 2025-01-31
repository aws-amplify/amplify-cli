import { releasesRequest, semverToGithubTag } from './github-common';
import { join } from 'path';

/**
 * This function expects a 'version' to already exist.
 * The release with proved version is marked as latest.
 */
const markReleaseAsLatest = async (version: string) => {
  const { id: releaseId } = await releasesRequest(join('tags', semverToGithubTag(version)));
  const releaseIdStr = (releaseId as number).toString();
  console.log(`Marking release ${version} as latest`);
  await releasesRequest(releaseIdStr, {
    method: 'PATCH',
    body: JSON.stringify({
      prerelease: false,
      make_latest: 'true',
    }),
  });
};

const main = async () => {
  const version = process.argv[2].trim();
  await markReleaseAsLatest(version);
};

main();
