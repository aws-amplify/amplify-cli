import { PackageLock, PackageLockDependencyType } from './package-lock-parser';
import { YarnLock, YarnLockDependencyType } from './yarn-lock-parser';
export type Lockfile = PackageLock | YarnLock;
export interface LockfileParser {
    parseLockFile: (lockFileContents: string) => Lockfile;
    getDependentPackageMap: (packageName: string, lockFileContents: string) => Record<string, Record<string, YarnLockDependencyType>> | Record<string, Record<string, PackageLockDependencyType>> | undefined;
}
//# sourceMappingURL=lock-file-interface.d.ts.map