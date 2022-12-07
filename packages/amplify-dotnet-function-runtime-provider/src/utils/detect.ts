import { CheckDependenciesResult } from 'amplify-function-plugin-interface';
import execa from 'execa';
import which from 'which';
import { currentSupportedVersion, executableName } from '../constants';

export const detectDotNet = async (): Promise<CheckDependenciesResult> => {
  const executablePath = which.sync(executableName, {
    nothrow: true,
  });

  if (executablePath === null) {
    return {
      hasRequiredDependencies: false,
      errorMessage: `Unable to find ${executableName} version ${currentSupportedVersion} on the path.`,
    };
  }

  const sdkResult = execa.sync(executableName, ['--list-sdks']);
  const installedSdks = sdkResult.stdout;

  if (sdkResult.exitCode !== 0) {
    throw new Error(`${executableName} failed SDK detection, exit code was ${sdkResult.exitCode}`);
  }
  const sdkInstalled = installedSdks && installedSdks.match(/^6\.0/m);

  const toolResult = execa.sync(executableName, ['tool', 'list', '--global']);
  const installedToolList = toolResult.stdout;

  if (toolResult.exitCode !== 0) {
    throw new Error(`${executableName} failed tool detection, exit code was ${toolResult.exitCode}`);
  }

  let toolInstalled = false;
  let testToolInstalled = false;
  if (installedToolList) {
    if (installedToolList.match(/^amazon\.lambda\.tools/m)) {
      toolInstalled = true;
    }
    if (installedToolList.match(/^amazon\.lambda\.testtool-6\.0/m)) {
      testToolInstalled = true;
    }
  }

  // Verify that a dotnet 6 SDK and the dotnet Lambda tools is installed locally
  if (sdkInstalled && toolInstalled && testToolInstalled) {
    return {
      hasRequiredDependencies: true,
    };
  } else {
    const result = {
      hasRequiredDependencies: false,
      errorMessage: 'Unable to detect required dependencies:\n',
    };
    if (!sdkInstalled) {
      result.errorMessage += '- The .NET 6 SDK must be installed. It can be installed from https://dotnet.microsoft.com/download\n';
    }
    if (!toolInstalled) {
      result.errorMessage +=
        '- The Amazon.Lambda.Tools global tool must be installed. Please install by running "dotnet tool install -g Amazon.Lambda.Tools".\n';
    }
    if (!testToolInstalled) {
      result.errorMessage +=
        '- The Amazon.Lambda.TestTool-6.0 global tool must be installed. Please install by running "dotnet tool install -g Amazon.Lambda.TestTool-6.0".\n';
    }
    return result;
  }
};
