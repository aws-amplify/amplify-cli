import * as fs from 'fs-extra';
import * as path from 'path';
import * as which from 'which';
import { coerce, SemVer } from 'semver';
import { execWithOutputAsString } from './shell-utils';

/**
 * package managers type
 */
export type PackageManagerType = 'yarn' | 'npm';

const packageJson = 'package.json';

/**
 * package Manager type
 */
export type PackageManager = {
  packageManager: PackageManagerType;
  lockFile: string;
  executable: string;
  version?: SemVer;
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
export const getPackageManager = async (rootPath?: string): Promise<PackageManager | null> => {
  const effectiveRootPath = rootPath ?? process.cwd();
  const checkExecutable = (executable: string) => which.sync(executable, { nothrow: true });

  let tempFilePath = path.join(effectiveRootPath, packageJson);

  if (!fs.existsSync(tempFilePath)) {
    return null;
  }

  // checks for yarn
  tempFilePath = path.join(effectiveRootPath, packageManagers.yarn.lockFile);
  if (fs.existsSync(tempFilePath) && checkExecutable(packageManagers.yarn.executable)) {
    return await getYarnPackageManager(rootPath);
  }

  // checks for npm
  tempFilePath = path.join(effectiveRootPath, packageManagers.npm.lockFile);
  if (fs.existsSync(tempFilePath)) {
    return packageManagers.npm;
  }

  // no lock files found
  if (checkExecutable(packageManagers.yarn.executable)) {
    return await getYarnPackageManager(rootPath);
  }

  return packageManagers.npm;
};

const getYarnPackageManager = async (rootPath: string | undefined): Promise<PackageManager | null> => {
  return {
    ...packageManagers.yarn,
    version: coerce(await execWithOutputAsString(`${packageManagers.yarn.executable} --version`, { cwd: rootPath })) ?? undefined,
  };
};
