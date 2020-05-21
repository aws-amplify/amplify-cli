export { addCleanupTask } from './cleanup-task';
export { getMockDataDirectory } from './mock-data-directory';
export { addMockDataToGitIgnore } from './git-ignore';
export async function getAmplifyMeta(context: any) {
  const amplifyMetaFilePath = context.amplify.pathManager.getAmplifyMetaFilePath();
  return context.amplify.readJsonFile(amplifyMetaFilePath);
}
export { hydrateAllEnvVars } from './lambda/hydrate-env-vars';

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

  const regex = /(\d+\.)(\d+\.)(\d)/g;
  // Java prints version to stderr
  const versionString: string = result.stderr ? result.stderr.split(/\r?\n/)[0] : '';
  const version = versionString.match(regex);

  if (version == null && !semver.satisfies(version[0], minJavaVersion)) {
    context.print.warning(`Update java to 8+`);
  }
};
