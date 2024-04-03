import * as fs from 'fs-extra';
import * as path from 'path';
import which from 'which';
import { coerce, SemVer } from 'semver';
import { execWithOutputAsString } from './shell-utils';
import { AmplifyError } from '../errors/amplify-error';
import { BuildType } from '@aws-amplify/amplify-function-plugin-interface';

/**
 * package managers type
 */
export type PackageManagerType = 'yarn' | 'npm' | 'pnpm' | 'custom';
const packageJson = 'package.json';

/**
 * package Manager type
 */
export interface PackageManager {
  readonly packageManager: PackageManagerType;
  readonly lockFile: string;
  readonly executable: string;
  readonly displayValue: string;
  version?: SemVer;
  getRunScriptArgs: (scriptName: string) => string[];
  getInstallArgs: (buildType: BuildType, resourceDir?: string) => string[];
}

class NpmPackageManager implements PackageManager {
  readonly packageManager = 'npm';
  readonly displayValue = 'NPM';
  readonly executable = 'npm';
  readonly lockFile = 'package-lock.json';

  getRunScriptArgs = (scriptName: string) => ['run-script', scriptName];
  getInstallArgs = (buildType = BuildType.PROD) => ['install', '--no-bin-links'].concat(buildType === 'PROD' ? ['--production'] : []);
}

class YarnPackageManager implements PackageManager {
  readonly packageManager: PackageManagerType = 'yarn';
  readonly displayValue = 'Yarn';
  readonly executable = 'yarn';
  readonly lockFile = 'yarn.lock';
  version?: SemVer;

  getRunScriptArgs = (scriptName: string) => [scriptName];
  getInstallArgs = (buildType = BuildType.PROD, resourceDir = '') => {
    const useYarnModern = this.version?.major && this.version?.major > 1;
    /**
     * Since Yarn 2, resourceDir needs to be treated as a separate project,
     * otherwise it'll be hoisted to use the lock.file from the parent directory,
     * so we need to create a lock file for it.
     * ref: https://github.com/yarnpkg/yarn/issues/5716#issuecomment-817330338
     */
    if (useYarnModern) {
      if (fs.existsSync(`${resourceDir}/${this.lockFile}`)) {
        console.log(`${resourceDir}/${this.lockFile} already exists.`);
      } else {
        fs.writeFileSync(`${resourceDir}/${this.lockFile}`, '');
      }
    }
    return (useYarnModern ? ['workspaces', 'focus'] : ['--no-bin-links']).concat(buildType === 'PROD' ? ['--production'] : []);
  };
}

class PnpmPackageManager implements PackageManager {
  readonly packageManager: PackageManagerType = 'pnpm';
  readonly displayValue = 'PNPM';
  readonly executable = 'pnpm';
  readonly lockFile = 'pnpm-lock.yaml';

  getRunScriptArgs = (scriptName: string) => [scriptName];
  getInstallArgs = () => ['install'];
}

class CustomPackageManager implements PackageManager {
  readonly packageManager: PackageManagerType = 'custom';
  readonly displayValue = 'Custom Build Command or Script Path';
  lockFile;
  executable;
  version?: SemVer;

  constructor() {
    this.lockFile = '';
    this.executable = '';
  }
  getRunScriptArgs = () => {
    throw new AmplifyError('PackagingLambdaFunctionError', {
      message: `Packaging lambda function failed. Unsupported package manager`,
    });
  };
  getInstallArgs = () => {
    throw new AmplifyError('PackagingLambdaFunctionError', {
      message: `Packaging lambda function failed. Unsupported package manager`,
    });
  };
}

export const packageManagers: Record<PackageManagerType, PackageManager> = {
  npm: new NpmPackageManager(),
  yarn: new YarnPackageManager(),
  pnpm: new PnpmPackageManager(),
  custom: new CustomPackageManager(),
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

const getYarnPackageManager = async (rootPath: string | undefined): Promise<PackageManager | null> => {
  packageManagers.yarn.version =
    coerce(await execWithOutputAsString(`${packageManagers.yarn.executable} --version`, { cwd: rootPath })) ?? undefined;
  return packageManagers.yarn;
};
