export { getMockDataDirectory } from './mock-data-directory';
export { addMockDataToGitIgnore } from './git-ignore';
export async function getAmplifyMeta(context: any) {
  const amplifyMetaFilePath = context.amplify.pathManager.getAmplifyMetaFilePath();
  return context.amplify.readJsonFile(amplifyMetaFilePath);
}

import * as which from 'which';
import * as execa from 'execa';
import * as semver from 'semver';

const minJavaVersion = '>=1.8 <= 2.0 ||  >=8.0';

export const checkJavaVersion = async context => {
  const executablePath = which.sync('java', {
    nothrow: true,
  });

  if (executablePath === null) {
    context.print.error(`Unable to find Java version ${minJavaVersion} on the path. Download link: https://amzn.to/2UUljp9`);
  }

  const result = execa.sync('java', ['-version']);

  if (result.exitCode !== 0) {
    context.print.error(`java failed, exit code was ${result.exitCode}`);
  }

  // Java prints version to stderr
  if (isUnsupportedJavaVersion(result.stderr)) {
    context.print.warning(`Update java to 8+`);
  }
};

function isUnsupportedJavaVersion(stderr: string | null): boolean {
  const regex = /version "(\d+)(\.(\d+\.)(\d))?/g;
  const versionStrings: Array<string> = stderr ? stderr.split(/\r?\n/) : [''];
  const mayVersion = versionStrings.map(line => line.match(regex)).find(v => v != null);
  if (mayVersion === undefined) {
    return true;
  }
  const version = mayVersion[0].replace('version "', '');
  const semVer = version.match(/^\d+$/g) === null ? version : `${version}.0.0`;
  return !semver.satisfies(semVer, minJavaVersion);
}

export const _isUnsupportedJavaVersion: (stderr: string | null) => boolean = isUnsupportedJavaVersion;
