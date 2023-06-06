import * as fs from 'fs-extra';
import * as path from 'path';
import * as which from 'which';
import { coerce, SemVer } from 'semver';
import { execWithOutputAsString } from './shell-utils';
import { AmplifyError } from '../errors/amplify-error';

/**
 * package managers type
 */
export type PackageManagerType = 'yarn' | 'npm' | 'pnpm';
const packageJson = 'package.json';

/**
 * package Manager type
 */
export type PackageManager = {
  packageManager: PackageManagerType;
  lockFile: string;
  executable: string;
  version?: SemVer;
  displayValue?: string;
};

const isWindows = process.platform === 'win32';

export const packageManagers: Record<string, PackageManager> = {
  npm: {
    packageManager: 'npm',
    lockFile: 'package-lock.json',
    executable: isWindows ? 'npm.cmd' : 'npm',
    displayValue: 'NPM',
  },
  yarn: {
    packageManager: 'yarn',
    lockFile: 'yarn.lock',
    executable: isWindows ? 'yarn.cmd' : 'yarn',
    displayValue: 'Yarn',
  },
  pnpm: {
    packageManager: 'pnpm',
    lockFile: 'pnpm-lock.yaml',
    executable: isWindows ? 'pnpm.cmd' : 'pnpm',
    displayValue: 'PNPM',
  },
};

export const getPackageManagerByType = (packageManagerType: PackageManagerType): PackageManager => {
  return packageManagers[packageManagerType];
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

  // checks for pnpm
  tempFilePath = path.join(effectiveRootPath, packageManagers.pnpm.lockFile);
  if (fs.existsSync(tempFilePath) && checkExecutable(packageManagers.pnpm.executable)) {
    return packageManagers.pnpm;
  }

  // checks for yarn
  tempFilePath = path.join(effectiveRootPath, packageManagers.yarn.lockFile);
  if (fs.existsSync(tempFilePath) && checkExecutable(packageManagers.yarn.executable)) {
    return getYarnPackageManager(rootPath);
  }

  // checks for npm
  tempFilePath = path.join(effectiveRootPath, packageManagers.npm.lockFile);
  if (fs.existsSync(tempFilePath)) {
    return packageManagers.npm;
  }

  // no lock files found
  if (checkExecutable(packageManagers.yarn.executable)) {
    return getYarnPackageManager(rootPath);
  }

  if (checkExecutable(packageManagers.pnpm.executable)) {
    return packageManagers.pnpm;
  }

  return packageManagers.npm;
};

export const toPackageManagerRunScriptArgs = async (packageManager: PackageManager, scriptName: string): Promise<string[]> => {
  switch (packageManager.packageManager) {
    case 'yarn':
    case 'pnpm':
      return [scriptName];
    case 'npm':
      return ['run-script', scriptName];
    default: {
      throw new AmplifyError('PackagingLambdaFunctionError', {
        message: `Packaging lambda function failed. Unsupported package manager ${packageManager.packageManager}`,
      });
    }
  }
};

export const toPackageManagerInstallArgs = async (packageManager: PackageManager): Promise<string[]> => {
  switch (packageManager.packageManager) {
    case 'yarn': {
      const useYarnModern = packageManager.version?.major && packageManager.version?.major > 1;
      return useYarnModern ? ['install'] : ['--no-bin-links', '--production'];
    }
    case 'npm': {
      return ['install', '--no-bin-links', '--production'];
    }
    case 'pnpm': {
      return ['install'];
    }
    default: {
      throw new AmplifyError('PackagingLambdaFunctionError', {
        message: `Packaging lambda function failed. Unsupported package manager ${packageManager.packageManager}`,
      });
    }
  }
};

const getYarnPackageManager = async (rootPath: string | undefined): Promise<PackageManager | null> => {
  return {
    ...packageManagers.yarn,
    version: coerce(await execWithOutputAsString(`${packageManagers.yarn.executable} --version`, { cwd: rootPath })) ?? undefined,
  };
};
