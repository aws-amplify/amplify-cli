import { pathManager, JSONUtilities, $TSContext, $TSAny } from 'amplify-cli-core';
import { printer } from 'amplify-prompts';
import fs from 'fs-extra';
import path from 'path';
import { extractArgs } from './extractArgs';
const REQUIRED_PACKAGES: { [key: string]: string } = { '@aws-amplify/ui-react': '*', 'aws-amplify': '*' };

export const notifyMissingPackages = (context: $TSContext) => {
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
  Object.keys(REQUIRED_PACKAGES).forEach(packageName => {
    const packageIsInstalled = Object.keys(packageJson.dependencies).includes(packageName);
    if (!packageIsInstalled) {
      printer.warn(`UIBuilder components required "${packageName}" that is not in your package.json. Run \`npm install ${packageName}\``);
    } else if (!packageVersionMatches(REQUIRED_PACKAGES[packageName], packageJson.dependencies[packageName])) {
      printer.warn(
        `UIBuilder components requires version "${REQUIRED_PACKAGES[packageName]}" of "${packageName}". You currently are on version "${packageJson.dependencies[packageName]}".`,
      );
    }
  });
};

const packageVersionMatches = (requiredVersion: string, existingVersion: string) => {
  if (requiredVersion === '*') {
    return true;
  }

  return requiredVersion === existingVersion;
};
