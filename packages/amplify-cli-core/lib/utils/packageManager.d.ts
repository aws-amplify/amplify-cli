export type PackageManagerType = 'yarn' | 'npm' | 'yarn2';
export type PackageManager = {
    packageManager: PackageManagerType;
    lockFile: string;
    executable: string;
    yarnrcPath?: string;
};
export declare const getPackageManager: (rootPath?: string) => PackageManager | null;
//# sourceMappingURL=packageManager.d.ts.map