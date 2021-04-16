import { execSync } from 'child_process';
import { getPackageManager, normalizePackageManagerForOS, getPackageManagerCommand } from '../packageManagerHelpers';
import { exitOnNextTick } from 'amplify-cli-core';

export async function postInitSetup(context) {
  if (context.parameters.options.app) {
    // Pushing a sample app
    try {
      context.parameters.options.app = true;
      context.parameters.options.y = true;
      context.amplify.constructExeInfo(context);
      await context.amplify.pushResources(context);
      await runPackage();
    } catch (e) {
      console.log(e);
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
  const packageManager = await getPackageManager();
  const normalizedPackageManager = await normalizePackageManagerForOS(packageManager);
  const packageCommand = await getPackageManagerCommand();
  if (normalizedPackageManager) {
    execSync(`${normalizedPackageManager} ${packageCommand}`, { stdio: 'inherit' });
  }
}
