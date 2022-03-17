import { $TSContext, exitOnNextTick, getPackageManager, JSONUtilities } from 'amplify-cli-core';
import { execSync } from 'child_process';
import _ from 'lodash';
import * as path from 'path';

const packageJson = 'package.json';
const initializationScripts = ['start', 'serve'];
const MISSING_SCRIPTS_ERROR = new Error(
  'Did not find a "start" or "serve" initialization script. Add a package.json file in the root of the project with one of these scripts.',
);

export async function postInitSetup(context: $TSContext) {
  if (context.parameters.options.app) {
    // Pushing a sample app
    try {
      context.parameters.options.app = true;
      context.parameters.options.y = true;
      context.amplify.constructExeInfo(context);
      await context.amplify.pushResources(context);
      await runPackage();
    } catch (e) {
      if (e.name !== 'InvalidDirectiveError') {
        context.print.error(`An error occurred during the push operation: ${e.message}`);
      }
      await context.usageData.emitError(e);
      exitOnNextTick(1);
    }
  }
}

/**
 * Install package using the correct package manager if package handling file exists
 *
 * @param packageManager either npm or yarn
 */
async function runPackage() {
  const packageManager = getPackageManager();

  if (packageManager !== null) {
    const packageScript = getPackageScript();

    execSync(`${packageManager.executable} ${packageScript}`, { stdio: 'inherit' });
  }
}

/**
 * Determine the starting command of the current project
 *
 * @return {string} 'serve' or 'start'
 */
function getPackageScript() {
  const packageJsonDir = path.join(process.cwd(), packageJson);
  const packageJsonContent = JSONUtilities.readJson(packageJsonDir, { throwIfNotExist: false }) || {};
  const scripts = _.get(packageJsonContent, 'scripts', {});

  return (
    _.keys(scripts).find(scriptName => initializationScripts.includes(scriptName)) ||
    (() => {
      throw MISSING_SCRIPTS_ERROR;
    })()
  );
}
