import { LockfileType } from './lock-file-types';
export type YarnLockFileTypes = LockfileType.YARN | LockfileType.YARN2;
export interface YarnLock {
    type: string;
    object: YarnLockDependency;
    dependencies?: YarnLockDependency;
    lockfileType: LockfileType.YARN | LockfileType.YARN2;
    lockfileVersion: 1 | 2;
}
export interface YarnLockDependency {
    [dependencyName: string]: YarnLockDependencyType;
}
export interface YarnLockDependencyType {
    version: string;
    dependencies?: {
        [depName: string]: string;
    };
}
export declare class YarnLockParser {
    type: YarnLockFileTypes;
    dependenciesMap: Record<string, Record<string, YarnLockDependencyType>>;
    constructor();
    parseLockFile: (lockFileContents: string) => YarnLock;
    getDependentPackageMap(packageName: string, lockFileContents: string): Record<string, Record<string, YarnLockDependencyType>> | undefined;
    private dfs;
    private getDependencyKey;
}
//# sourceMappingURL=yarn-lock-parser.d.ts.map