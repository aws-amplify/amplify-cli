import {
  pathManager, JSONUtilities, $TSContext, $TSAny,
} from 'amplify-cli-core';
import { printer } from 'amplify-prompts';
import fs from 'fs-extra';
import path from 'path';
import rangeSubset from 'semver/ranges/subset';
import { RequiredDependency } from '@aws-amplify/codegen-ui';
import { ReactRequiredDependencyProvider } from '@aws-amplify/codegen-ui-react';
import { extractArgs } from './extractArgs';

const getRequiredDependencies = (): RequiredDependency[] => new ReactRequiredDependencyProvider().getRequiredDependencies();

/**
 * Displays a warning to the user if they have npm dependencies
 * they need to install in their application for UIBuilder components to work properly
 */
export const notifyMissingPackages = (context: $TSContext): void => {
  const args = extractArgs(context);
  const localEnvFilePath = args.localEnvFilePath ?? pathManager.getLocalEnvFilePath();
  if (!fs.existsSync(localEnvFilePath)) {
    printer.debug('localEnvFilePath could not be determined - skipping dependency notification.');
    return;
  }
  const localEnvJson = JSONUtilities.readJson(localEnvFilePath);
  const packageJsonPath = path.join((localEnvJson as $TSAny).projectPath, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    printer.debug('package.json file not found - skipping dependency notification.');
    return;
  }
  const packageJson = JSONUtilities.readJson(packageJsonPath) as { dependencies: { [key: string]: string } };
  getRequiredDependencies().forEach((dependency: $TSAny) => {
    const packageIsInstalled = Object.keys(packageJson.dependencies).includes(dependency.dependencyName);
    if (!packageIsInstalled) {
      printer.warn(
        `UIBuilder components require "${dependency.dependencyName}" that is not in your package.json. Run \`npm install "${dependency.dependencyName}@${dependency.supportedSemVerPattern}"\`. ${dependency.reason}`,
      );
    } else if (!rangeSubset(packageJson.dependencies[dependency.dependencyName], dependency.supportedSemVerPattern)) {
      printer.warn(
        `UIBuilder components require version "${dependency.supportedSemVerPattern}" of "${
          dependency.dependencyName
        }". You currently are on version "${packageJson.dependencies[dependency.dependencyName]}". Run \`npm install "${
          dependency.dependencyName
        }@${dependency.supportedSemVerPattern}"\`. ${dependency.reason}`,
      );
    }
  });
};
