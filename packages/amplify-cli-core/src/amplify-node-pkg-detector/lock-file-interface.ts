import { PackageLock, PackageLockDependencyType } from './package-lock-parser';
import { YarnLock, YarnLockDependencyType } from './yarn-lock-parser';

/**
  * lock file type
  */
export type Lockfile = PackageLock | YarnLock;

/**
  * lock file parser interface
  */
export interface LockfileParser {
    parseLockFile: (lockFileContents: string) => Lockfile;
    getDependentPackageMap: (packageName: string, lockFileContents: string) => Record<string, Record<string, YarnLockDependencyType>>
        | Record<string, Record< string, PackageLockDependencyType>> | undefined;
}
