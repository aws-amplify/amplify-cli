"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.lambdasWithApiDependency = void 0;
const path = __importStar(require("path"));
const loadFunctionParameters_1 = require("./loadFunctionParameters");
const constants_1 = require("../../../constants");
async function lambdasWithApiDependency(context, allResources, backendDir, modelsDeleted) {
    const dependentFunctions = [];
    const lambdaFuncResources = allResources.filter((resource) => resource.service === "Lambda" &&
        resource.mobileHubMigrated !== true &&
        resource.dependsOn !== undefined &&
        resource.dependsOn.find((val) => val.category === 'api'));
    for (const lambda of lambdaFuncResources) {
        const resourceDirPath = path.join(backendDir, constants_1.categoryName, lambda.resourceName);
        const currentParameters = (0, loadFunctionParameters_1.loadFunctionParameters)(resourceDirPath);
        const selectedCategories = currentParameters.permissions;
        let deletedModelFound;
        if (typeof selectedCategories === 'object' && selectedCategories !== null) {
            for (const selectedResources of Object.values(selectedCategories)) {
                deletedModelFound = Object.keys(selectedResources).some((r) => modelsDeleted.includes(r));
                if (deletedModelFound) {
                    dependentFunctions.push(lambda);
                }
            }
        }
    }
    return dependentFunctions;
}
exports.lambdasWithApiDependency = lambdasWithApiDependency;
//# sourceMappingURL=getDependentFunction.js.map