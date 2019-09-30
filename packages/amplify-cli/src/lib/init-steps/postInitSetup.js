const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function run(context) {
  if (context.parameters.options.app) {
    // Pushing a sample app
    try {
      context.parameters.options.app = true;
      context.parameters.options.y = true;
      context.amplify.constructExeInfo(context);
      await context.amplify.pushResources(context);
      const packageManager = await getPackageManager();
      await runPackage(packageManager);
    } catch (e) {
      if (e.name !== 'InvalidDirectiveError') {
        context.print.error(`An error occured during the push operation: ${e.message}`);
      }
      process.exit(1);
    }
  }
  process.exit(0);
}

/**
 * Determine the package manager of the current project
 *
 * @return {string} 'yarn' if yarn.lock exists, 'npm' if package.json exists, undefined otherwise
*/
async function getPackageManager() {
  const yarnLock = './yarn.lock';
  const yarnLockDir = path.join(process.cwd(), yarnLock);
  const packageJson = './package.json';
  const packageJsonDir = path.join(process.cwd(), packageJson);
  if (fs.existsSync(yarnLockDir)) {
    return 'yarn';
  } else if (fs.existsSync(packageJsonDir)) {
    return 'npm';
  }
  return undefined;
}

/**
 * Install package using the correct package manager if package handling file exists
 *
 * @param packageManager either npm or yarn
 */
async function runPackage() {
  const packageManager = getPackageManager();
  if (packageManager === 'yarn') {
    await execSync('yarn start', { stdio: 'inherit' });
  } else if (packageManager === 'npm') {
    await execSync('npm start', { stdio: 'inherit' });
  }
}

module.exports = {
  run,
};
