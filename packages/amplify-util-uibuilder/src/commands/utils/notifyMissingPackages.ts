import { pathManager, JSONUtilities, $TSContext, $TSAny } from 'amplify-cli-core';
import { printer } from 'amplify-prompts';
import fs from 'fs-extra';
import path from 'path';
import rangeSubset from 'semver/ranges/subset';
import { extractArgs } from './extractArgs';
import { ReactRequiredDependencyProvider } from '@aws-amplify/codegen-ui-react-old';
import { ReactRequiredDependencyProvider as ReactRequiredDependencyProviderNew } from '@aws-amplify/codegen-ui-react-new';

const isUpdatedSchema = (schemas: any[]) => {
  return schemas.some(schema => schema.schemaVersion && schema.schemaVersion == '1.0');
};

const getRequiredDependencies = (schemas: any[]) => {
  if (isUpdatedSchema(schemas)) {
    return new ReactRequiredDependencyProviderNew().getRequiredDependencies();
  }
  return new ReactRequiredDependencyProvider().getRequiredDependencies();
};

export const notifyMissingPackages = (context: $TSContext, schemas: any[]) => {
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
  getRequiredDependencies(schemas).forEach((dependency: any) => {
    const packageIsInstalled = Object.keys(packageJson.dependencies).includes(dependency.dependencyName);
    if (!packageIsInstalled) {
      printer.warn(
        `UIBuilder components required "${dependency.dependencyName}" that is not in your package.json. Run \`npm install "${dependency.dependencyName}@${dependency.supportedSemVerPattern}"\`. ${dependency.reason}`,
      );
    } else if (!rangeSubset(packageJson.dependencies[dependency.dependencyName], dependency.supportedSemVerPattern)) {
      printer.warn(
        `UIBuilder components requires version "${dependency.supportedSemVerPattern}" of "${
          dependency.dependencyName
        }". You currently are on version "${packageJson.dependencies[dependency.dependencyName]}". Run \`npm install "${
          dependency.dependencyName
        }@${dependency.supportedSemVerPattern}"\`. ${dependency.reason}`,
      );
    }
  });
};
