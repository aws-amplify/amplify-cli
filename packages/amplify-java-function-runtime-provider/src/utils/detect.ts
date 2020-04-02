import * as which from 'which';
import * as execa from 'execa';
import * as semver from 'semver';
import { minJavaVersion, minGradleVersion } from './constants';
import { CheckDependenciesResult } from 'amplify-function-plugin-interface/src';

export const checkJava = async (): Promise<CheckDependenciesResult> => {
  const executablePath = which.sync('java', {
    nothrow: true,
  });

  if (executablePath === null) {
    return {
      hasRequiredDependencies: false,
      errorMessage: `Unable to find Java version ${minJavaVersion} on the path. Download link: https://amzn.to/2UUljp9`,
    };
  }

  const result = execa.sync('java', ['-version']);

  if (result.exitCode !== 0) {
    throw new Error(`java failed, exit code was ${result.exitCode}`);
  }

  const regex = /(\d+\.)(\d+\.)(\d)/g;
  // Java prints version to stderr
  const versionString: string = result.stderr ? result.stderr.split(/\r?\n/)[0] : '';
  const version = versionString.match(regex);

  if (version !== null && semver.satisfies(version[0], minJavaVersion)) {
    return {
      hasRequiredDependencies: true,
    };
  }

  return {
    hasRequiredDependencies: false,
    errorMessage: `Update JDK to ${minJavaVersion}. Download link: https://amzn.to/2UUljp9`,
  };
};

export const checkGradle = async (): Promise<CheckDependenciesResult> => {
  const executablePath = which.sync('gradle', {
    nothrow: true,
  });

  if (executablePath === null) {
    return {
      hasRequiredDependencies: false,
      errorMessage: `Unable to find Gradle version ${minGradleVersion} on the path. Download link: https://bit.ly/3aGYDj6`,
    };
  }

  const result = execa.sync('gradle', ['-v']);

  if (result.exitCode !== 0) {
    throw new Error(`gradle failed, exit code was ${result.exitCode}`);
  }

  const regex = /(\d+\.)(\d+)/g;
  const versionLines = result.stdout ? result.stdout.split(/\r?\n/) : [];
  const versionString: string = versionLines.length >= 3 ? versionLines[2] : '';
  const version = versionString.match(regex);

  // SemVer requires 3 elements for matching
  if (version !== null && semver.satisfies(version[0] + '.0', minGradleVersion)) {
    return {
      hasRequiredDependencies: true,
    };
  }

  return {
    hasRequiredDependencies: false,
    errorMessage: `Update Gradle to ${minGradleVersion}. Download link: https://bit.ly/3aGYDj6`,
  };
};

export const checkJavaCompiler = async () => {
  const executablePath = which.sync('javac', {
    nothrow: true,
  });

  if (executablePath === null) {
    return {
      hasRequiredDependencies: false,
      errorMessage: `Unable to find Java compiler version ${minJavaVersion} on the path. Download link: https://amzn.to/2UUljp9`,
    };
  }

  const result = execa.sync('javac', ['-version']);

  if (result.exitCode !== 0) {
    throw new Error(`java failed, exit code was ${result.exitCode}`);
  }

  const regex = /(\d+\.)(\d+\.)(\d)/g;
  // Java compiler prints version to stdout
  const versionString: string = result.stdout ? result.stdout.split(/\r?\n/)[0] : '';
  const version = versionString.match(regex);

  if (version !== null && semver.satisfies(version[0], minJavaVersion)) {
    return {
      hasRequiredDependencies: true,
    };
  }

  return {
    hasRequiredDependencies: false,
    errorMessage: `Update JDK to ${minJavaVersion}. Download link: https://amzn.to/2UUljp9`,
  };
};
