import { CheckDependenciesResult } from 'amplify-function-plugin-interface';
import { executeCommand } from './helpers';
import { SWIFT_MIN_VERSION, BUILD_TOOL_INFO_MSG } from './constants';
import { SemVer, coerce, lt } from 'semver';
import * as which from 'which';

export const checkDependencies = async (runtimeValue: string): Promise<CheckDependenciesResult> => {
  let overallResult: CheckDependenciesResult = {
    hasRequiredDependencies: true,
  };
  const errArray: Array<String> = [];

  const swiftResult = await checkSwift();
  if (swiftResult.errorMessage !== undefined) {
    overallResult.hasRequiredDependencies = false;
    errArray.push(swiftResult.errorMessage);
  }
  const buildToolResult = await checkSwiftLambda();
  if (buildToolResult.errorMessage !== undefined) {
    overallResult.hasRequiredDependencies = false;
    errArray.push(buildToolResult.errorMessage);
  }

  if (!overallResult.hasRequiredDependencies) {
    overallResult.errorMessage = errArray.join('\n');
  }
  return overallResult;
};

// checkSwift makes sure that "swift" is in the PATH, and that an acceptable version is installed.
const checkSwift = async (): Promise<CheckDependenciesResult> => {
  const executableName = 'swift';

  // Check if Swift is in the PATH.
  const executablePath = which.sync(executableName, { nothrow: true });
  if (executablePath === null) {
    // TODO: replace rick roll yt link to a documentation link.
    // Something like this, maybe: https://docs.amplify.aws/cli/function#supported-lambda-runtimes
    return {
      hasRequiredDependencies: false,
      errorMessage: `The "${executableName}" executable was not found in PATH. "${executableName}" may be installed by following these instructions: https://www.youtube.com/watch?v=oHg5SJYRHA0`,
    };
  }

  // Validate Swift version.
  // versionOutput should look something like:
  //
  // Apple Swift version 5.3 (swiftlang-1200.0.25.2 clang-1200.0.27.1)
  // Target: x86_64-apple-darwin19.6.0
  const versionOutput = executeCommand(executableName, ['--version']);
  if (!versionOutput) {
    return {
      hasRequiredDependencies: false,
      errorMessage: `Failed to fetch "${executableName}" version with: "${executableName} --version"`,
    };
  }
  const parts = versionOutput.split(' ');
  const expectedNumParts = 7;
  if (parts.length !== expectedNumParts || parts[0] !== 'Apple' || parts[1] !== 'Swift' || parts[2] !== 'version') {
    return {
      hasRequiredDependencies: false,
      errorMessage: `Invalid "${executableName}" version string: ${versionOutput}`,
    };
  }
  const versionNum = <SemVer>coerce(parts[3]);
  if (lt(versionNum, SWIFT_MIN_VERSION)) {
    return {
      hasRequiredDependencies: false,
      errorMessage: `The "${executableName}" version found was: ${versionNum}, but must be greater than or equal to ${SWIFT_MIN_VERSION}}`,
    };
  }

  return { hasRequiredDependencies: true };
};

// checkSwiftLambda validates that the swift-lambda cross-compilation tool is installed.
//
// The swift-lambda tool doesn't have a "--version" flag, or any equivalent, as of August 2020. Since the official instructions for
// installing swift-lambda (https://github.com/swiftxcode/swift-lambda#installation) recommend installing the tool via homebrew, we use
// homebrew to make sure that the swift-lambda tool is installed correctly.
const checkSwiftLambda = async (): Promise<CheckDependenciesResult> => {
  const homebrewCaskName = 'swift-lambda';

  // Validate that the swift-lambda build tool that's installed on a user's machine is the tool that we think it is.
  // versionOutput should look something like:
  //
  // spmdestinations/tap/swift-lambda: stable 0.1.0
  // Scripts to build and deploy Swift Package Manager projects on AWS Lambda
  // ...
  const versionOutput = executeCommand('brew', ['info', homebrewCaskName]);
  if (!versionOutput) {
    return {
      hasRequiredDependencies: false,
      errorMessage: `Failed to verify ${homebrewCaskName} installation with: "brew info ${homebrewCaskName}"`,
    };
  }
  const parts = versionOutput.split('\n');
  const infoMsg = parts[1];
  if (infoMsg !== BUILD_TOOL_INFO_MSG) {
    // TODO: replace rick roll yt link to a documentation link. Something like this, maybe: https://docs.amplify.aws/cli/function#supported-lambda-runtimes
    return {
      hasRequiredDependencies: false,
      errorMessage: `The "${homebrewCaskName}" tool that you have installed is not the tool that the Amplify CLI needs. Please install "${homebrewCaskName}" by following these instructions: https://www.youtube.com/watch?v=oHg5SJYRHA0`,
    };
  }

  return { hasRequiredDependencies: true };
};
