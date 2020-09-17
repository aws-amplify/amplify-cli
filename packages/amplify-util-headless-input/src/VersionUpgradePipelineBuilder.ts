import { VersionUpgradePipeline } from './HeadlessInputValidator';

/**
 * Utility class that can be used to construct a VersionUpgradePipeline by specifying an array of transformation functions and a map of version numbers to array indexes
 */
export class VersionUpgradePipelineBuilder {
  private versionIndexMap: Map<number, number> = new Map();
  private transformationFunctions: Function[] = [];

  withVersionIndexMap(map: Map<number, number>) {
    this.versionIndexMap = map;
    return this;
  }

  withTransformationFunctions(functions: Function[]) {
    this.transformationFunctions = functions;
    return this;
  }

  build(): VersionUpgradePipeline {
    return version => {
      return this.transformationFunctions.slice(this.versionIndexMap.get(version));
    };
  }
}
