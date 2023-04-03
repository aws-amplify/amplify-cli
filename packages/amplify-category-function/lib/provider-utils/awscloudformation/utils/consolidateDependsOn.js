"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.consolidateDependsOnForLambda = void 0;
const constants_1 = require("./constants");
const consolidateDependsOnForLambda = (projectMeta, currentDependsOn, lambdaToUpdate, selectedSettings) => {
    var _a, _b, _c;
    let updatedDependsOn;
    const prevFunctionParametersDependsOn = (_c = (_b = (_a = projectMeta === null || projectMeta === void 0 ? void 0 : projectMeta.function) === null || _a === void 0 ? void 0 : _a[`${lambdaToUpdate}`]) === null || _b === void 0 ? void 0 : _b.dependsOn) !== null && _c !== void 0 ? _c : [];
    if (selectedSettings.includes(constants_1.resourceAccessSetting)) {
        const prevLayersDependsOn = prevFunctionParametersDependsOn.filter((resource) => { var _a, _b; return ((_b = (_a = projectMeta === null || projectMeta === void 0 ? void 0 : projectMeta.function) === null || _a === void 0 ? void 0 : _a[`${resource.resourceName}`]) === null || _b === void 0 ? void 0 : _b.service) === "LambdaLayer"; });
        updatedDependsOn = currentDependsOn.concat(prevLayersDependsOn);
    }
    if (selectedSettings.includes(constants_1.lambdaLayerSetting)) {
        const prevDependsOnExcludingLayers = prevFunctionParametersDependsOn.filter((resource) => { var _a, _b; return ((_b = (_a = projectMeta === null || projectMeta === void 0 ? void 0 : projectMeta.function) === null || _a === void 0 ? void 0 : _a[`${resource.resourceName}`]) === null || _b === void 0 ? void 0 : _b.service) !== "LambdaLayer"; });
        updatedDependsOn = currentDependsOn.concat(prevDependsOnExcludingLayers);
    }
    return updatedDependsOn;
};
exports.consolidateDependsOnForLambda = consolidateDependsOnForLambda;
//# sourceMappingURL=consolidateDependsOn.js.map