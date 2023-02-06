import * as fs from 'fs-extra';
import * as path from 'path';
import * as which from 'which';

/**
 * package managers type
 */
export type PackageManagerType = 'yarn' | 'npm' | 'yarn2';

const packageJson = 'package.json';

/**
 * package Manager type
 */
export type PackageManager = {
  packageManager: PackageManagerType;
  lockFile: string;
  executable: string;
  // only exists if yarn2 is used
  yarnrcPath?: string
};

const isWindows = process.platform === 'win32';

const packageManagers: Record<string, PackageManager> = {
  npm: {
    packageManager: 'npm',
    lockFile: 'package-lock.json',
    executable: isWindows ? 'npm.cmd' : 'npm',
  },
  yarn: {
    packageManager: 'yarn',
    lockFile: 'yarn.lock',
    executable: isWindows ? 'yarn.cmd' : 'yarn',
  },
  yarn2: {
    packageManager: 'yarn',
    lockFile: 'yarn.lock',
    executable: isWindows ? 'yarn.cmd' : 'yarn',
    yarnrcPath: '.yarnrc.yml',
  },
};

/**
  * Detect the package manager in the passed in directory or process.cwd, with a preference to yarn over npm
  * 1. Check if a package.json file present in the directory as it is mandatory, if not return null
  * 2. Check if yarn.lock is present and yarn is present and .yarnrc.yml is present on the system for yarn2
  * 3. Check if yarn.lock is present and yarn is present on the system
  * 4. Check if package-lock.json is present
  * 5. Check if yarn present on the system
  * 6. Fallback to npm

  @returns {PackageManager | null} instance for the package manager that was detected or null if not found.

 */
export const getPackageManager = (rootPath?: string): PackageManager | null => {
  const effectiveRootPath = rootPath ?? process.cwd();
  const checkExecutable = (executable: string) => which.sync(executable, { nothrow: true });

  let tempFilePath = path.join(effectiveRootPath, packageJson);

  if (!fs.existsSync(tempFilePath)) {
    return null;
  }

  tempFilePath = path.join(effectiveRootPath, packageManagers.yarn.lockFile);

  // checks for yarn2
  if (packageManagers.yarn2.yarnrcPath !== undefined) {
    const yarnRcFilePath = path.join(effectiveRootPath, packageManagers.yarn2.yarnrcPath);
    if (fs.existsSync(tempFilePath) && checkExecutable(packageManagers.yarn.executable) && fs.existsSync(yarnRcFilePath)) {
      return packageManagers.yarn2;
    }
  }

  if (fs.existsSync(tempFilePath) && checkExecutable(packageManagers.yarn.executable)) {
    return packageManagers.yarn;
  }

  tempFilePath = path.join(effectiveRootPath, packageManagers.npm.lockFile);

  if (fs.existsSync(tempFilePath)) {
    return packageManagers.npm;
  }

  // No lock files present at this point
  // check for yarn2
  if (packageManagers.yarn2.yarnrcPath !== undefined) {
    const yarnRcFilePath = path.join(effectiveRootPath, packageManagers.yarn2.yarnrcPath);
    if (fs.existsSync(yarnRcFilePath) && checkExecutable(packageManagers.yarn.executable)) {
      return packageManagers.yarn2;
    }
  }
  if (checkExecutable(packageManagers.yarn.executable)) {
    return packageManagers.yarn;
  }

  return packageManagers.npm;
};
