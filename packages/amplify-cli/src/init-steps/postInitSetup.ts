import { execSync } from 'child_process';
import { getPackageManager } from '../packageManagerHelpers';
import { normalizePackageManagerForOS } from '../packageManagerHelpers';

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
      if (e.name !== 'InvalidDirectiveError') {
        context.print.error(`An error occurred during the push operation: ${e.message}`);
      }
      process.exit(1);
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
  if (normalizedPackageManager) {
    execSync(`${normalizedPackageManager} start`, { stdio: 'inherit' });
  }
}
