export type DetectedDependency = {
    packageName?: string;
    dependentPackage?: {
        name: string;
        version: string;
    };
};
export type AmplifyNodePkgDetectorProps = {
    projectRoot: string;
};
export declare class AmplifyNodePkgDetector {
    private readonly packageManager;
    private readonly pkgJsonObj;
    private readonly lockFileContents;
    private readonly lockFileParser;
    constructor(amplifyDetectorProps: AmplifyNodePkgDetectorProps);
    private parsePkgJson;
    private getLockFileContent;
    detectAffectedDirectDependencies: (dependencyToSearch: string) => Array<DetectedDependency> | [];
}
//# sourceMappingURL=amplify-nodejs-detector.d.ts.map