import execa = require('execa');
import versionCommand = require('@lerna/version');
import * as path from 'path';

const main = async () => {
  const errors: string[] = [];
  // Todo: add support for preId and distTag
  const preId = process.argv[2];
  const distTag = process.argv[3];

  const versionChanges = await bumpVersions(preId, distTag);
  for (const packageName of Array.from(versionChanges.keys())) {
    const pkgVersion = versionChanges.get(packageName);
    const gitTagName = await getGitTagName(packageName, pkgVersion);
    const versionPublished = await doesVersionExist(packageName, pkgVersion);
    if (versionPublished) {
      errors.push(`${packageName}@${pkgVersion} is already published to npm`);
      continue;
    }
    if (await checkIfTagExists(gitTagName)) {
      errors.push(`${packageName}@${pkgVersion} tag already exists`);
    }
  }
  if (errors.length) {
    console.log(errors.join('\n'));
    process.exit(1);
  } else {
    console.log('No conflicts detected. Safe to proceed with publishing');
  }
};

const bumpVersions = async (preid?: string, distTag?: string): Promise<Map<string, string>> => {
  let versionChanges;

  await new Promise((resolve, reject) => {
    const config: any = {
      conventionalCommits: true,
      exact: true,
      composed: 'publish',
      amend: false,
      push: false,
      yes: true,
      changelog: false,
      commitHooks: false,
      noPush: true,
      gitTagVersion: false,
      onResolved: resolve,
      onRejected: reject,
      private: false,
    };
    if (preid !== undefined) {
      config.preid = preid;
      config.distTag = distTag;
    }

    versionChanges = versionCommand(config);
  });

  await resetChanges();
  return versionChanges.updatesVersions;
};

const resetChanges = () => {
  execa.sync('git', ['reset', '--hard', 'HEAD'], {
    cwd: path.resolve(__dirname, '../'),
  });
};

const getGitTagName = (packageName: string, version: string): string => {
  return `${packageName}@${version}`;
};

const checkIfTagExists = async (tag: string): Promise<boolean> => {
  try {
    const result = await execa.sync('git', ['show-ref', '--tags', tag, '--quiet'], {
      cwd: path.resolve(__dirname, '../'),
    });
    return result.exitCode === 0;
  } catch (e) {
    return false;
  }
};

const doesVersionExist = async (packageName: string, version: string): Promise<boolean> => {
  try {
    const result = await execa.sync('npm', ['view', `${packageName}@${version}`, '--json']);
    JSON.parse(result.stdout);
    return true;
  } catch (e) {
    return false;
  }
};

main();
