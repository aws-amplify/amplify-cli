import { LockfileType } from './lock-file-types';
export interface PackageLock {
    name: string;
    version: string;
    dependencies?: PackageLockDependency;
    lockfileVersion: 1 | 2;
    type: LockfileType.NPM;
}
export interface PackageLockDependency {
    [depName: string]: PackageLockDependencyType;
}
export interface PackageLockDependencyType {
    version: string;
    requires?: {
        [depName: string]: string;
    };
    dependencies?: PackageLockDependency;
    dev?: boolean;
}
export declare class PackageLockParser {
    type: LockfileType;
    dependenciesMap: Record<string, Record<string, PackageLockDependencyType>>;
    constructor();
    parseLockFile: (lockFileContents: string) => PackageLock;
    getDependentPackageMap: (packageName: string, lockFileContents: string) => Record<string, Record<string, PackageLockDependencyType>> | undefined;
    private dfs;
}
//# sourceMappingURL=package-lock-parser.d.ts.map