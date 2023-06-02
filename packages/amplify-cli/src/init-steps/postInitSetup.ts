import { $TSContext, AmplifyFault, AmplifyError, getPackageManager, JSONUtilities } from '@aws-amplify/amplify-cli-core';
import { execSync } from 'child_process';
import _ from 'lodash';
import * as path from 'path';

const packageJson = 'package.json';
const initializationScripts = ['start', 'serve'];
const MISSING_SCRIPTS_ERROR = new Error(
  'Did not find a "start" or "serve" initialization script. Add a package.json file in the root of the project with one of these scripts.',
);

/**
 * Run the post initialization setup for the current project
 */
export const postInitSetup = async (context: $TSContext): Promise<void> => {
  if (context.parameters.options?.app) {
    // Pushing a sample app
    try {
      context.parameters.options.app = true;
      context.parameters.options.y = true;
      context.amplify.constructExeInfo(context);
      await context.amplify.pushResources(context);
      await runPackage();
    } catch (e) {
      if (e instanceof AmplifyError) {
        throw e;
      }
      throw new AmplifyFault(
        'ProjectInitFault',
        {
          message: 'An error occurred during project initialization',
          link: 'https://docs.amplify.aws/cli/project/troubleshooting/',
        },
        e,
      );
    }
  }
};

/**
 * Install package using the correct package manager if package handling file exists
 *
 * @param packageManager either npm or yarn
 */
const runPackage = async (): Promise<void> => {
  const packageManager = await getPackageManager();

  if (packageManager !== null) {
    const packageScript = getPackageScript();

    execSync(`${packageManager.executable} ${packageScript}`, { stdio: 'inherit' });
  }
};

/**
 * Determine the starting command of the current project
 *
 * @return {string} 'serve' or 'start'
 */
const getPackageScript = (): string => {
  const packageJsonDir = path.join(process.cwd(), packageJson);
  const packageJsonContent = JSONUtilities.readJson(packageJsonDir, { throwIfNotExist: false }) || {};
  const scripts = _.get(packageJsonContent, 'scripts', {});

  return (
    _.keys(scripts).find((scriptName) => initializationScripts.includes(scriptName)) ||
    (() => {
      throw MISSING_SCRIPTS_ERROR;
    })()
  );
};
