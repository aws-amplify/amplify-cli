import * as which from 'which';
import * as execa from 'execa';
import { CheckDependenciesResult } from 'amplify-function-plugin-interface/src';
import { executableName, currentSupportedVersion } from '../constants';

export const detectDotNetCore = async (): Promise<CheckDependenciesResult> => {
  const executablePath = which.sync(executableName, {
    nothrow: true,
  });

  if (executablePath === null) {
    return {
      hasRequiredDependencies: false,
      errorMessage: `Unable to find ${executableName} version ${currentSupportedVersion} on the path.`,
    };
  }

  const result = execa.sync(executableName, ['--list-sdks']);
  const installedSdks = result.stdout;

  if (result.exitCode !== 0) {
    throw new Error(`${executableName} failed, exit code was ${result.exitCode}`);
  }

  // Verify that a dotnet 3.1 SDK is installed locally
  if (installedSdks && installedSdks.match(/^3\.1/)) {
    return {
      hasRequiredDependencies: true,
    };
  } else {
    return {
      hasRequiredDependencies: false,
      errorMessage: `Expected ${executableName} minimum version ${currentSupportedVersion}, but found: ${installedSdks}`,
    };
  }
};
