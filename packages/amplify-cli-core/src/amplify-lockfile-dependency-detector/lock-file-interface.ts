import { PackageLock, PackageLockDep } from './package-lock-parser';
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
    getDependentPackage: (packageName: string, packageJsonVersion: string,
       lockFileContents: string) => Record<string, Record<string, YarnLockDependencyType>>
        | Record<string, Record< string, PackageLockDep>> | undefined;
    // getDependencyGraph: (packageName: string) => $TSAny;
}
