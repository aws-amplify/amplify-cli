"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VersionUpgradePipelineBuilder = void 0;
class VersionUpgradePipelineBuilder {
    constructor() {
        this.versionIndexMap = new Map();
        this.transformationFunctions = [];
    }
    withVersionIndexMap(map) {
        this.versionIndexMap = map;
        return this;
    }
    withTransformationFunctions(functions) {
        this.transformationFunctions = functions;
        return this;
    }
    build() {
        return (version) => {
            return this.transformationFunctions.slice(this.versionIndexMap.get(version));
        };
    }
}
exports.VersionUpgradePipelineBuilder = VersionUpgradePipelineBuilder;
//# sourceMappingURL=VersionUpgradePipelineBuilder.js.map