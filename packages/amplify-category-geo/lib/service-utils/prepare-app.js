"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cdkV1PrepareAppShim = void 0;
const constructs_1 = require("constructs");
const aws_cdk_lib_1 = require("aws-cdk-lib");
const cdkV1PrepareAppShim = (root) => {
    for (const dependency of findTransitiveDeps(root)) {
        const targetCfnResources = findCfnResources(dependency.target);
        const sourceCfnResources = findCfnResources(dependency.source);
        for (const target of targetCfnResources) {
            for (const source of sourceCfnResources) {
                source.addDependency(target);
            }
        }
    }
};
exports.cdkV1PrepareAppShim = cdkV1PrepareAppShim;
const findCfnResources = (root) => root.node.findAll().filter(aws_cdk_lib_1.CfnResource.isCfnResource);
const findTransitiveDeps = (root) => {
    const found = new Map();
    const ret = new Array();
    for (const source of root.node.findAll()) {
        for (const dependable of source.node.dependencies) {
            for (const target of constructs_1.Dependable.of(dependable).dependencyRoots) {
                let foundTargets = found.get(source);
                if (!foundTargets) {
                    found.set(source, (foundTargets = new Set()));
                }
                if (!foundTargets.has(target)) {
                    ret.push({ source, target });
                    foundTargets.add(target);
                }
            }
        }
    }
    return ret;
};
//# sourceMappingURL=prepare-app.js.map