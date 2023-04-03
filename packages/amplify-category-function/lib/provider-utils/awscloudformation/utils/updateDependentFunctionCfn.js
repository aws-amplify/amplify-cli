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
exports.addAppSyncInvokeMethodPermission = exports.updateDependentFunctionsCfn = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const execPermissionsWalkthrough_1 = require("../service-walkthroughs/execPermissionsWalkthrough");
const lambda_walkthrough_1 = require("../service-walkthroughs/lambda-walkthrough");
const loadFunctionParameters_1 = require("./loadFunctionParameters");
const path = __importStar(require("path"));
const constants_1 = require("./constants");
const constants_2 = require("../../../constants");
async function updateDependentFunctionsCfn(context, dependentFunctionResource, backendDir, modelsDeleted, apiResource) {
    for (const lambda of dependentFunctionResource) {
        const resourceDirPath = path.join(backendDir, constants_2.categoryName, lambda.resourceName);
        const currentParameters = (0, loadFunctionParameters_1.loadFunctionParameters)(resourceDirPath);
        const selectedCategories = currentParameters.permissions;
        let categoryPolicies = [];
        const permissions = {};
        let resources = [];
        const functionParameters = {
            resourceName: lambda.resourceName,
            environmentMap: {
                ENV: {
                    Ref: 'env',
                },
                REGION: {
                    Ref: 'AWS::Region',
                },
            },
        };
        for (const selectedCategory of Object.keys(selectedCategories)) {
            const selectedResources = selectedCategories[selectedCategory];
            for (const resourceName of Object.keys(selectedResources)) {
                if (!modelsDeleted.includes(resourceName)) {
                    const resourcePolicy = selectedResources[resourceName];
                    const { permissionPolicies, cfnResources } = await (0, execPermissionsWalkthrough_1.getResourcesForCfn)(context, resourceName, resourcePolicy, apiResource, selectedCategory);
                    categoryPolicies = categoryPolicies.concat(permissionPolicies);
                    if (!permissions[selectedCategory]) {
                        permissions[selectedCategory] = {};
                    }
                    permissions[selectedCategory][resourceName] = resourcePolicy;
                    resources = resources.concat(cfnResources);
                }
            }
        }
        const { environmentMap, dependsOn } = await (0, execPermissionsWalkthrough_1.generateEnvVariablesForCfn)(context, resources, {});
        functionParameters.categoryPolicies = categoryPolicies;
        functionParameters.mutableParametersState = { permissions };
        functionParameters.environmentMap = environmentMap;
        functionParameters.dependsOn = dependsOn;
        functionParameters.lambdaLayers = currentParameters.lambdaLayers;
        (0, lambda_walkthrough_1.updateCFNFileForResourcePermissions)(resourceDirPath, functionParameters, currentParameters, apiResource);
        currentParameters.permissions = permissions;
        const parametersFilePath = path.join(resourceDirPath, constants_1.functionParametersFileName);
        amplify_cli_core_1.JSONUtilities.writeJson(parametersFilePath, currentParameters);
        lambda.dependsOn = functionParameters.dependsOn;
        context.amplify.updateamplifyMetaAfterResourceUpdate(constants_2.categoryName, lambda.resourceName, 'dependsOn', lambda.dependsOn);
    }
}
exports.updateDependentFunctionsCfn = updateDependentFunctionsCfn;
function addAppSyncInvokeMethodPermission(functionName) {
    var _a;
    const resourceDirPath = amplify_cli_core_1.pathManager.getResourceDirectoryPath(undefined, constants_2.categoryName, functionName);
    const cfnFileName = `${functionName}-cloudformation-template.json`;
    const cfnFilePath = path.join(resourceDirPath, cfnFileName);
    const cfnContent = amplify_cli_core_1.JSONUtilities.readJson(cfnFilePath);
    if (!((_a = cfnContent === null || cfnContent === void 0 ? void 0 : cfnContent.Resources) === null || _a === void 0 ? void 0 : _a.PermissionForAppSyncToInvokeLambda)) {
        cfnContent.Resources.PermissionForAppSyncToInvokeLambda = {
            Type: 'AWS::Lambda::Permission',
            Properties: {
                FunctionName: {
                    Ref: 'LambdaFunction',
                },
                Action: 'lambda:InvokeFunction',
                Principal: 'appsync.amazonaws.com',
            },
        };
    }
    amplify_cli_core_1.JSONUtilities.writeJson(cfnFilePath, cfnContent);
}
exports.addAppSyncInvokeMethodPermission = addAppSyncInvokeMethodPermission;
//# sourceMappingURL=updateDependentFunctionCfn.js.map