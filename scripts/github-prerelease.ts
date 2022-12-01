import { join } from 'path';
import { valid, lte } from 'semver';
import { getArgs, githubTagToSemver, releasesRequest, semverToGithubTag, uploadReleaseFile } from './github-common';
import { readFile } from 'fs-extra';
import { unifiedChangelogPath } from './constants';

/**
 * Script for uploading packaged binaries of the CLI to GitHub releases.
 */
const binariesDir = join(__dirname, '..', 'out');
const binaryNamePrefix = 'amplify-pkg-';
const platformSuffixes = ['linux', 'linux-arm64', 'macos', 'win.exe'];

const validateVersion = async (version: string) => {
  if (!valid(version)) {
    throw new Error(`[${version}] is not a valid semver version string`);
  }

  const { tag_name } = await releasesRequest('latest');
  if (typeof tag_name !== 'string') {
    throw new Error('Could not fetch current version from GitHub releases');
  }

  const currentVersion = githubTagToSemver(tag_name);
  if (!valid(currentVersion)) {
    throw new Error(`Current version [${currentVersion}] on GitHub Releases is not a valid semver version`);
  }

  if (lte(version, currentVersion)) {
    throw new Error(`New version [${version}] is behind or at current version [${currentVersion}] on GitHub Releases`);
  }
};

const createPreRelease = async (version: string, commit: string) => {
  console.log('Creating draft pre-release');
  const { id: releaseId } = await releasesRequest('', {
    method: 'POST',
    body: JSON.stringify({
      tag_name: semverToGithubTag(version),
      name: version,
      body: await readFile(unifiedChangelogPath, 'utf8'),
      draft: true,
      prerelease: true,
      target_commitish: commit,
    }),
  });

  const releaseIdStr = (releaseId as number).toString();

  await Promise.all(
    platformSuffixes
      .map(suffix => `${binaryNamePrefix}${suffix}.tgz`)
      .map(binName => join(binariesDir, binName))
      .map(binPath => {
        console.log(`Uploading ${binPath} to release`);
        return binPath;
      })
      .map(binPath => uploadReleaseFile(releaseIdStr, binPath)),
  );

  console.log('Publishing pre-release');
  await releasesRequest(releaseIdStr, {
    method: 'PATCH',
    body: JSON.stringify({
      draft: false,
    }),
  });
};

const main = async () => {
  try {
    const { version, commit } = getArgs();
    await validateVersion(version);
    await createPreRelease(version, commit);
    console.log('Done!');
  } catch (ex) {
    console.error(ex);
    process.exitCode = 1;
  }
};

main();
