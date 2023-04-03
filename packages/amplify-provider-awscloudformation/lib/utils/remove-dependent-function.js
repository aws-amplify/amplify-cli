"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureValidFunctionModelDependencies = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const path_1 = __importDefault(require("path"));
const graphql_transformer_core_1 = require("graphql-transformer-core");
const ensureValidFunctionModelDependencies = async (context, apiResource, allResources) => {
    var _a, _b, _c;
    const backendDir = amplify_cli_core_1.pathManager.getBackendDirPath();
    const currentBackendDir = amplify_cli_core_1.pathManager.getCurrentCloudBackendDirPath();
    const tablesDeleted = await getTableNameDiff(currentBackendDir, backendDir, apiResource[0].resourceName);
    if (tablesDeleted.length === 0) {
        return undefined;
    }
    const dependentFunctionResource = await context.amplify.invokePluginMethod(context, 'function', undefined, 'lambdasWithApiDependency', [context, allResources, backendDir, tablesDeleted]);
    if (dependentFunctionResource.length === 0) {
        return dependentFunctionResource;
    }
    const dependentFunctionsNames = dependentFunctionResource.map((lambda) => lambda.resourceName);
    context.print.info('');
    context.print.warning(`Functions ${dependentFunctionsNames} have access to removed GraphQL API model(s) ${tablesDeleted}`);
    const continueToPush = !!((_b = (_a = context === null || context === void 0 ? void 0 : context.exeInfo) === null || _a === void 0 ? void 0 : _a.inputParams) === null || _b === void 0 ? void 0 : _b.yes);
    const forcePush = !!((_c = context === null || context === void 0 ? void 0 : context.exeInfo) === null || _c === void 0 ? void 0 : _c.forcePush);
    const continueForcePush = continueToPush && forcePush;
    if (continueForcePush) {
        await context.amplify.invokePluginMethod(context, 'function', undefined, 'updateDependentFunctionsCfn', [
            context,
            dependentFunctionResource,
            backendDir,
            tablesDeleted,
            apiResource[0].resourceName,
        ]);
    }
    else if (!continueToPush &&
        (await context.amplify.confirmPrompt('Do you want to remove the GraphQL model access on these affected functions?', false))) {
        await context.amplify.invokePluginMethod(context, 'function', undefined, 'updateDependentFunctionsCfn', [
            context,
            dependentFunctionResource,
            backendDir,
            tablesDeleted,
            apiResource[0].resourceName,
        ]);
    }
    else {
        throw new amplify_cli_core_1.AmplifyError('DeploymentError', {
            message: 'Failed to resolve appId.',
            resolution: `Run “amplify update function” on the affected functions ${dependentFunctionsNames} and remove the access permission to ${tablesDeleted}.`,
        });
    }
    return dependentFunctionResource;
};
exports.ensureValidFunctionModelDependencies = ensureValidFunctionModelDependencies;
const getTableNameDiff = async (currentBackendDir, backendDir, apiResourceName) => {
    const deployedModelNames = await getTableNames(currentBackendDir, apiResourceName);
    const currentModelNames = await getTableNames(backendDir, apiResourceName);
    const modelsDeleted = deployedModelNames.filter((val) => !currentModelNames.includes(val));
    return modelsDeleted;
};
const getTableNames = async (backendDir, apiResourceName) => {
    const appsyncTableSuffix = '@model(appsync)';
    const resourceDirPath = path_1.default.join(backendDir, 'api', apiResourceName);
    const project = await (0, graphql_transformer_core_1.readProjectConfiguration)(resourceDirPath);
    const directivesMap = (0, graphql_transformer_core_1.collectDirectivesByTypeNames)(project.schema);
    const modelNames = Object.keys(directivesMap.types).filter((typeName) => directivesMap.types[typeName].includes('model'));
    const tableNames = modelNames
        .map((modelName) => (0, graphql_transformer_core_1.getTableNameForModel)(project.schema, modelName))
        .map((modelName) => `${modelName}:${appsyncTableSuffix}`);
    return tableNames;
};
//# sourceMappingURL=remove-dependent-function.js.map