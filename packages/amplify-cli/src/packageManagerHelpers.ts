import * as path from 'path';
import * as fs from 'fs-extra';
import * as which from 'which';

const packageJson = 'package.json';
const packageJsonDir = path.join(process.cwd(), packageJson);

/**
 * Determine the package manager of the current project
 *
 * @return {string} 'yarn' if yarn.lock exists, 'npm' if package.json exists, undefined otherwise
 */
export async function getPackageManager() {
  const yarnLock = './yarn.lock';
  const yarnLockDir = path.join(process.cwd(), yarnLock);
  if (fs.existsSync(yarnLockDir)) {
    // Check that yarn is installed for the user
    if (which.sync('yarn', { nothrow: true }) || which.sync('yarn.cmd', { nothrow: true })) {
      return 'yarn';
    }
    return 'npm';
  } else if (fs.existsSync(packageJsonDir)) {
    return 'npm';
  }
  return undefined;
}

/**
 * Determine the starting command of the current project
 *
 * @return {string} 'serve' or 'start'
 */
export async function getPackageManagerCommand() {
  let scripts;
  if (fs.existsSync(packageJsonDir)) {
    const pjson = fs.readFileSync(packageJsonDir).toString();
    const parsedPjson = JSON.parse(pjson);
    scripts = parsedPjson['scripts'];
  }

  if (scripts['start']) {
    return 'start';
  } else if (scripts['serve']) {
    return 'serve';
  } else {
    throw new Error('initialize script was not found');
  }
}

/**
 * Determines the OS and returns the corresponding command given a package manager
 *
 * @param {string} packageManager the type of package manager detected
 * @return {string} the package manager command for the correct OS
 */
export async function normalizePackageManagerForOS(packageManager) {
  const isOnWindows = /^win/.test(process.platform);
  if (isOnWindows) {
    if (packageManager === 'yarn') {
      return 'yarn.cmd';
    } else if (!packageManager) {
      return undefined;
    }
    return 'npm.cmd';
  }
  return packageManager;
}
