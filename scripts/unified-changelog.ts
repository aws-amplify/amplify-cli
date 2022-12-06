import * as execa from 'execa';
import * as fs from 'fs-extra';
import { join, parse, sep } from 'path';
import { unifiedChangelogPath } from './constants';
/**
 * This script is intended to be run after running `yarn publish-to-verdaccio` when all CHANGELOG file changes are staged but not committed
 * It will scan all staged CHANGELOG.md files and merge them into a single UNIFIED_CHANGELOG file
 */
const packageRoot = join(__dirname, '..');
// exported because this path is also referenced in github-prerelease.ts

const getChangelogPaths = async (): Promise<string[]> => {
  console.log('Getting staged CHANGELOG files');
  const { stdout: statusResult, stderr } = await execa.command('git status --porcelain', { cwd: packageRoot });
  if (stderr) {
    throw new Error(`git status failed with error [${stderr}]`);
  }
  const changelogPaths = statusResult
    .split('\n')
    // match lines of the form ` M package/name/whatever`
    .map(item => item.match(/^\s*M\s*(.*)/)?.[1])
    .filter(item => item && item.endsWith('CHANGELOG.md'))
    .map(item => join(packageRoot, item!));
  return changelogPaths;
};

interface ChangelogInfo {
  packageName: string;
  latestChanges: string; // markdown string
}
const extractChangelogInfo = async (changelogPath: string): Promise<ChangelogInfo> => {
  console.log(`Extracting latest changes from [${changelogPath}]`);
  const changelog = await fs.readFile(changelogPath, 'utf8');
  const versionSplitRegex = /#+ \[?\d+\.\d+\.\d+[^\]]*\]?/;
  const startMatch = changelog.match(versionSplitRegex);
  if (!startMatch?.index) {
    throw new Error(`No version information found in [${changelogPath}]`);
  }
  const startIdx = startMatch.index;
  const nextLineIdx = changelog.indexOf('\n', startIdx);
  const endMatch = changelog.slice(nextLineIdx).match(versionSplitRegex);

  // if no previous version found, assume that this is the first version in the changelog
  const endIdx = endMatch?.index ? endMatch.index + nextLineIdx : changelog.length;

  const latestChanges = changelog.slice(startIdx, endIdx).trim();
  // assumes CHANGELOG is in the root of the package directory and that the package directory is named after the package
  const packageName = parse(changelogPath)
    .dir.split(sep)
    .reverse()[0];
  return {
    packageName,
    latestChanges,
  };
};

const formatUnifiedChangelog = (infos: ChangelogInfo[]): string => {
  console.log('Formatting all changes into single changelog');
  var formattedChangelogComponents = infos
    .filter(info => info.latestChanges)
    .filter(info => info.latestChanges.includes('\n')) // if the latestChanges string doesn't contain a newline it's only a version bump
    .sort((a, b) => a.packageName.localeCompare(b.packageName))
    .map(info => {
      const latestChanges = info.latestChanges.replace(/^#+\s+/, ''); // strip off any leading markdown headers
      return `# ${info.packageName} ${latestChanges}`;
    });
    // only include version bump sections if the release is all version bumps to avoid an empty change log
    if (formattedChangelogComponents.some(component => !component.includes('Version bump only for package'))) {
      formattedChangelogComponents = formattedChangelogComponents.filter(component => !component.includes('Version bump only for package'));
    }
    const formattedChangelog = formattedChangelogComponents.join('\n\n');
  return `# Change Log\n\n${formattedChangelog}`;
};

const writeUnifiedChangelog = async (log: string) => {
  console.log(`Writing unified changelog to [${unifiedChangelogPath}]`);
  await fs.writeFile(unifiedChangelogPath, log);
};

const main = async () => {
  const changelogPaths = await getChangelogPaths();
  const changelogInfos = await Promise.all(changelogPaths.map(extractChangelogInfo));
  const unifiedChangelog = formatUnifiedChangelog(changelogInfos);
  await writeUnifiedChangelog(unifiedChangelog);
};

main();
