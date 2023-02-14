export { getMockDataDirectory, getMockAPIResourceDirectory, getMockSearchableTriggerDirectory } from './mock-directory';
export { addMockDataToGitIgnore, addMockAPIResourcesToGitIgnore } from './git-ignore';
export async function getAmplifyMeta(context: any) {
  const amplifyMetaFilePath = context.amplify.pathManager.getAmplifyMetaFilePath();
  return context.amplify.readJsonFile(amplifyMetaFilePath);
}

import * as which from 'which';
import * as execa from 'execa';
import * as semver from 'semver';
import _ from 'lodash';
import { AmplifyFault } from 'amplify-cli-core';
import { printer } from 'amplify-prompts';
import fs from 'fs-extra';

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

export const checkJavaHome = () => {
  const javaHomeValue = process?.env?.JAVA_HOME;
  if(_.isEmpty(javaHomeValue)) {
    const resolutionMessage = 'Set the JAVA_HOME environment variable to point to the installed JDK directory and retry';
    printer.info(resolutionMessage);
    throw new AmplifyFault('MockProcessFault', {
      message: 'JAVA_HOME variable not set',
      resolution: resolutionMessage
    });
  }

  if(!fs.existsSync(javaHomeValue)) {
    const resolutionMessage = 'Set the JAVA_HOME environment variable to point to a valid JDK directory and retry';
    printer.info(resolutionMessage);
    throw new AmplifyFault('MockProcessFault', {
      message: 'JAVA_HOME variable is set to invalid path',
      resolution: resolutionMessage
    });
  }
}
