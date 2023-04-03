export declare enum LockfileType {
    NPM = "npm",
    YARN = "yarn",
    YARN2 = "yarn2"
}
export type PackageJson = {
    name: string;
    version: string;
    dependencies: Record<string, string>;
    devDependencies?: Record<string, string>;
    peerDependencies?: Record<string, string>;
};
//# sourceMappingURL=lock-file-types.d.ts.map