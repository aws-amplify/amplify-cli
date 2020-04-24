import * as which from 'which';
import * as execa from 'execa';
import { CheckDependenciesResult } from 'amplify-function-plugin-interface/src';
import { executableName, currentSupportedVersion } from '../constants';
import inquirer from 'inquirer';

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

  const sdkResult = execa.sync(executableName, ['--list-sdks']);
  const installedSdks = sdkResult.stdout;

  if (sdkResult.exitCode !== 0) {
    throw new Error(`${executableName} failed SDK detection, exit code was ${sdkResult.exitCode}`);
  }
  const sdkInstalled = installedSdks && installedSdks.match(/^3\.1/);

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
    if (installedToolList.match(/^amazon\.lambda\.testtool-3\.1/m)) {
      testToolInstalled = true;
    }
  }

  if (!toolInstalled) {
    toolInstalled = await installGlobalTool('Amazon.Lambda.Tools');
  }
  if (!testToolInstalled) {
    testToolInstalled = await installGlobalTool('Amazon.Lambda.TestTool-3.1');
  }

  // Verify that a dotnet 3.1 SDK and the dotnet Lambda tools is installed locally
  if (sdkInstalled && toolInstalled && testToolInstalled) {
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

async function installGlobalTool(toolName: string): Promise<boolean> {
  let response = await inquirer.prompt({
    type: 'confirm',
    name: 'installToolkit',
    message: `The ${toolName} global tool is required but was not detected.\nWould you like to install this tool?`,
    default: 'Y',
  });
  if (response.installToolkit) {
    let toolInstallationResult = execa.sync(executableName, ['tool', 'install', '-g', toolName]);
    if (toolInstallationResult.exitCode !== 0) {
      throw new Error(`${executableName} failed tool installation, exit code was ${toolInstallationResult.exitCode}`);
    }
    return true;
  }
  return false;
}
