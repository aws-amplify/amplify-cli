import { VersionUpgradePipeline } from './HeadlessInputValidator';
export declare class VersionUpgradePipelineBuilder {
    private versionIndexMap;
    private transformationFunctions;
    withVersionIndexMap(map: Map<number, number>): this;
    withTransformationFunctions(functions: ((...args: unknown[]) => unknown)[]): this;
    build(): VersionUpgradePipeline;
}
//# sourceMappingURL=VersionUpgradePipelineBuilder.d.ts.map