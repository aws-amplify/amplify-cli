import { pathManager, JSONUtilities, $TSContext, $TSAny } from '@aws-amplify/amplify-cli-core';
import { printer } from '@aws-amplify/amplify-prompts';
import fs from 'fs-extra';
import path from 'path';
import rangeSubset from 'semver/ranges/subset';
import { extractArgs } from './extractArgs';
import { CodegenDependencies } from 'aws-sdk/clients/amplifyuibuilder';

type PackageJson = { dependencies: { [key: string]: string } };

/**
 * Returns a parsed package.json file if present
 * @param context cli context object
 * @returns A JSON object representing the package.json file in the local project or undefined if not found
 */
export const parsePackageJsonFile = (context: $TSContext): PackageJson | undefined => {
  const args = extractArgs(context);
  const localEnvFilePath = args.localEnvFilePath ?? pathManager.getLocalEnvFilePath();
  if (!fs.existsSync(localEnvFilePath)) {
    printer.debug('localEnvFilePath could not be determined - skipping parsing file.');
    return undefined;
  }
  const localEnvJson = JSONUtilities.readJson(localEnvFilePath);
  const packageJsonPath = path.join((localEnvJson as $TSAny).projectPath, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    printer.debug('package.json file not found');
    return undefined;
  }
  const packageJson = JSONUtilities.readJson(packageJsonPath) as PackageJson;
  return packageJson;
};

/**
 * Get the versions of the codegen dependencies from the package.json file
 * @param packageJsonFile
 * @returns codegen dependencies and versions
 */
export const getStartCodegenJobDependencies = (packageJsonFile: PackageJson) => {
  const codegenDependencies: { [key: string]: string } = {};
  ['aws-amplify', '@aws-amplify/ui-react-storage', '@aws-amplify/ui-react'].forEach((dep) => {
    if (packageJsonFile.dependencies[dep]) {
      codegenDependencies[dep] = packageJsonFile.dependencies[dep];
    } else {
      // use the latest available if there aren't any current dependencies in the project
      codegenDependencies[dep] = 'latest';
    }
  });
  return codegenDependencies;
};

/**
 * Displays a warning to the user if they have npm dependencies
 * they need to install in their application for UIBuilder components to work properly
 */
export const notifyMissingPackages = (
  context: $TSContext,
  hasStorageManagerField?: boolean,
  dependencies?: CodegenDependencies | undefined,
): void => {
  const packageJson = parsePackageJsonFile(context);
  if (!packageJson) {
    printer.debug('skipping dependency notification.');
    return;
  }

  // don't warn about the storage dependency if the project doesn't need it
  const dependenciesToCheck = hasStorageManagerField
    ? dependencies
    : dependencies?.filter((dependency) => dependency.name !== '@aws-amplify/ui-react-storage');

  dependenciesToCheck?.forEach((dependency) => {
    const packageIsInstalled = Object.keys(packageJson.dependencies).includes(`${dependency.name}`);
    if (!packageIsInstalled) {
      printer.warn(
        `UIBuilder components require "${dependency.name}" that is not in your package.json. Run \`npm install "${dependency.name}@${dependency.supportedVersion}"\`. ${dependency.reason}`,
      );
    } else if (!rangeSubset(packageJson.dependencies[`${dependency.name}`], dependency.supportedVersion ?? '')) {
      printer.warn(
        `UIBuilder components require version "${dependency.supportedVersion}" of "${dependency.name}". You currently are on version "${
          packageJson.dependencies[`${dependency.name}`]
        }". Run \`npm install "${dependency.name}@${dependency.supportedVersion}"\`. ${dependency.reason}`,
      );
    }
  });
};
