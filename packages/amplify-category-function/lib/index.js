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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.postPushCleanup = exports.lambdaLayerPrompt = exports.handleAmplifyEvent = exports.executeAmplifyCommand = exports.isMockable = exports.getBuilder = exports.getInvoker = exports.initEnv = exports.getPermissionPolicies = exports.migrate = exports.console = exports.update = exports.add = exports.loadFunctionParameters = exports.addAppSyncInvokeMethodPermission = exports.updateDependentFunctionsCfn = exports.ensureLambdaExecutionRoleOutputs = exports.packageResource = exports.migrateLegacyLayer = exports.hashLayerResource = exports.lambdasWithApiDependency = exports.ServiceName = exports.buildTypeKeyMap = exports.buildResource = exports.askExecRolePermissionsQuestions = exports.category = void 0;
const amplify_environment_parameters_1 = require("@aws-amplify/amplify-environment-parameters");
const amplify_cli_core_1 = require("amplify-cli-core");
const lodash_1 = __importDefault(require("lodash"));
const path = __importStar(require("path"));
const promise_sequential_1 = __importDefault(require("promise-sequential"));
const constants_1 = require("./constants");
const postEnvRemoveHandler_1 = require("./events/postEnvRemoveHandler");
const postPushHandler_1 = require("./events/postPushHandler");
const preExportHandler_1 = require("./events/preExportHandler");
const prePushHandler_1 = require("./events/prePushHandler");
const awscloudformation_1 = require("./provider-utils/awscloudformation");
const cloneSecretsOnEnvInitHandler_1 = require("./provider-utils/awscloudformation/secrets/cloneSecretsOnEnvInitHandler");
const functionSecretsStateManager_1 = require("./provider-utils/awscloudformation/secrets/functionSecretsStateManager");
const secretName_1 = require("./provider-utils/awscloudformation/secrets/secretName");
const buildFunction_1 = require("./provider-utils/awscloudformation/utils/buildFunction");
const environmentVariablesHelper_1 = require("./provider-utils/awscloudformation/utils/environmentVariablesHelper");
const layerConfiguration_1 = require("./provider-utils/awscloudformation/utils/layerConfiguration");
const packageLayer_1 = require("./provider-utils/awscloudformation/utils/packageLayer");
const supported_services_1 = require("./provider-utils/supported-services");
var constants_2 = require("./constants");
Object.defineProperty(exports, "category", { enumerable: true, get: function () { return constants_2.categoryName; } });
var execPermissionsWalkthrough_1 = require("./provider-utils/awscloudformation/service-walkthroughs/execPermissionsWalkthrough");
Object.defineProperty(exports, "askExecRolePermissionsQuestions", { enumerable: true, get: function () { return execPermissionsWalkthrough_1.askExecRolePermissionsQuestions; } });
var build_1 = require("./provider-utils/awscloudformation/utils/build");
Object.defineProperty(exports, "buildResource", { enumerable: true, get: function () { return build_1.buildResource; } });
var buildFunction_2 = require("./provider-utils/awscloudformation/utils/buildFunction");
Object.defineProperty(exports, "buildTypeKeyMap", { enumerable: true, get: function () { return buildFunction_2.buildTypeKeyMap; } });
var constants_3 = require("./provider-utils/awscloudformation/utils/constants");
Object.defineProperty(exports, "ServiceName", { enumerable: true, get: function () { return constants_3.ServiceName; } });
var getDependentFunction_1 = require("./provider-utils/awscloudformation/utils/getDependentFunction");
Object.defineProperty(exports, "lambdasWithApiDependency", { enumerable: true, get: function () { return getDependentFunction_1.lambdasWithApiDependency; } });
var layerHelpers_1 = require("./provider-utils/awscloudformation/utils/layerHelpers");
Object.defineProperty(exports, "hashLayerResource", { enumerable: true, get: function () { return layerHelpers_1.hashLayerResource; } });
var layerMigrationUtils_1 = require("./provider-utils/awscloudformation/utils/layerMigrationUtils");
Object.defineProperty(exports, "migrateLegacyLayer", { enumerable: true, get: function () { return layerMigrationUtils_1.migrateLegacyLayer; } });
var package_1 = require("./provider-utils/awscloudformation/utils/package");
Object.defineProperty(exports, "packageResource", { enumerable: true, get: function () { return package_1.packageResource; } });
var ensure_lambda_arn_outputs_1 = require("./provider-utils/awscloudformation/utils/ensure-lambda-arn-outputs");
Object.defineProperty(exports, "ensureLambdaExecutionRoleOutputs", { enumerable: true, get: function () { return ensure_lambda_arn_outputs_1.ensureLambdaExecutionRoleOutputs; } });
var updateDependentFunctionCfn_1 = require("./provider-utils/awscloudformation/utils/updateDependentFunctionCfn");
Object.defineProperty(exports, "updateDependentFunctionsCfn", { enumerable: true, get: function () { return updateDependentFunctionCfn_1.updateDependentFunctionsCfn; } });
Object.defineProperty(exports, "addAppSyncInvokeMethodPermission", { enumerable: true, get: function () { return updateDependentFunctionCfn_1.addAppSyncInvokeMethodPermission; } });
var loadFunctionParameters_1 = require("./provider-utils/awscloudformation/utils/loadFunctionParameters");
Object.defineProperty(exports, "loadFunctionParameters", { enumerable: true, get: function () { return loadFunctionParameters_1.loadFunctionParameters; } });
const add = async (context, providerName, service, parameters) => {
    const options = {
        service,
        providerPlugin: providerName,
        build: true,
    };
    const providerController = require(`./provider-utils/${providerName}/index`);
    if (!providerController) {
        context.print.error('Provider not configured for this category');
        return undefined;
    }
    return providerController.addResource(context, constants_1.categoryName, service, options, parameters);
};
exports.add = add;
const update = async (context, providerName, service, parameters, resourceToUpdate) => {
    const providerController = require(`./provider-utils/${providerName}/index`);
    if (!providerController) {
        context.print.error('Provider not configured for this category');
        return undefined;
    }
    return providerController.updateResource(context, constants_1.categoryName, service, parameters, resourceToUpdate);
};
exports.update = update;
const console = async (context) => {
    context.print.info(`to be implemented: ${constants_1.categoryName} console`);
};
exports.console = console;
const migrate = async (context) => {
    const { projectPath, amplifyMeta } = context.migrationInfo;
    const migrateResourcePromises = [];
    Object.keys(amplifyMeta).forEach((category) => {
        if (category === constants_1.categoryName) {
            Object.keys(amplifyMeta[category]).forEach((resourceName) => {
                try {
                    const providerController = require(`./provider-utils/${amplifyMeta[category][resourceName].providerPlugin}/index`);
                    if (providerController) {
                        migrateResourcePromises.push(providerController.migrateResource(context, projectPath, amplifyMeta[category][resourceName].service, resourceName));
                    }
                    else {
                        context.print.error(`Provider not configured for ${category}: ${resourceName}`);
                    }
                }
                catch (e) {
                    context.print.warning(`Could not run migration for ${category}: ${resourceName}`);
                    throw e;
                }
            });
        }
    });
    await Promise.all(migrateResourcePromises);
};
exports.migrate = migrate;
const getPermissionPolicies = async (context, resourceOpsMapping) => {
    const amplifyMeta = context.amplify.getProjectMeta();
    const permissionPolicies = [];
    const resourceAttributes = [];
    Object.keys(resourceOpsMapping).forEach((resourceName) => {
        try {
            const providerName = amplifyMeta[constants_1.categoryName][resourceName].providerPlugin;
            if (providerName) {
                const providerController = require(`./provider-utils/${providerName}/index`);
                const { policy, attributes } = providerController.getPermissionPolicies(context, amplifyMeta[constants_1.categoryName][resourceName].service, resourceName, resourceOpsMapping[resourceName]);
                permissionPolicies.push(policy);
                resourceAttributes.push({ resourceName, attributes, category: constants_1.categoryName });
            }
            else {
                context.print.error(`Provider not configured for ${constants_1.categoryName}: ${resourceName}`);
            }
        }
        catch (e) {
            context.print.warning(`Could not get policies for ${constants_1.categoryName}: ${resourceName}`);
            throw e;
        }
    });
    return { permissionPolicies, resourceAttributes };
};
exports.getPermissionPolicies = getPermissionPolicies;
const initEnv = async (context) => {
    var _a, _b;
    const { amplify } = context;
    const { envName } = amplify.getEnvInfo();
    const { allResources, resourcesToBeCreated, resourcesToBeDeleted, resourcesToBeUpdated } = await amplify.getResourceStatus(constants_1.categoryName);
    const resourceCategoryFilter = (resource) => resource.category === constants_1.categoryName;
    resourcesToBeDeleted.filter(resourceCategoryFilter).forEach((functionResource) => {
        amplify.removeResourceParameters(context, constants_1.categoryName, functionResource.resourceName);
    });
    const tasks = resourcesToBeCreated.concat(resourcesToBeUpdated).filter(resourceCategoryFilter);
    const functionTasks = tasks.map((functionResource) => {
        const { resourceName, service } = functionResource;
        return async () => {
            const config = await (0, awscloudformation_1.updateConfigOnEnvInit)(context, resourceName, service);
            amplify.saveEnvResourceParameters(context, constants_1.categoryName, resourceName, config);
        };
    });
    const sourceEnv = (_a = context.exeInfo) === null || _a === void 0 ? void 0 : _a.sourceEnvName;
    const isNewEnv = (_b = context.exeInfo) === null || _b === void 0 ? void 0 : _b.isNewEnv;
    const envParamManager = (await (0, amplify_environment_parameters_1.ensureEnvParamManager)()).instance;
    const projectPath = amplify_cli_core_1.pathManager.findProjectRoot();
    const currentAmplifyMeta = amplify_cli_core_1.stateManager.getCurrentMeta(projectPath);
    const amplifyMeta = amplify_cli_core_1.stateManager.getMeta(projectPath);
    const changedResources = [...resourcesToBeCreated, ...resourcesToBeDeleted, ...resourcesToBeUpdated];
    allResources
        .filter(resourceCategoryFilter)
        .filter((r) => !changedResources.includes(r))
        .forEach((r) => {
        const { resourceName } = r;
        const resourceParamManager = envParamManager.getResourceParamManager(constants_1.categoryName, resourceName);
        const s3Bucket = lodash_1.default.get(currentAmplifyMeta, [constants_1.categoryName, resourceName, 's3Bucket'], undefined);
        if (s3Bucket) {
            resourceParamManager.setParams(s3Bucket);
            lodash_1.default.setWith(amplifyMeta, [constants_1.categoryName, resourceName, 's3Bucket'], s3Bucket);
        }
        if ((0, functionSecretsStateManager_1.getLocalFunctionSecretNames)(resourceName, { fromCurrentCloudBackend: true }).length > 0) {
            resourceParamManager.setParam(secretName_1.secretsPathAmplifyAppIdKey, (0, secretName_1.getAppId)());
        }
    });
    const sourceEnvParamManager = (await (0, amplify_environment_parameters_1.ensureEnvParamManager)(sourceEnv)).instance;
    resourcesToBeCreated.forEach((resource) => {
        const { resourceName, service } = resource;
        const sourceEnvResourceParamManager = sourceEnvParamManager.getResourceParamManager(constants_1.categoryName, resourceName);
        const currentEnvResourceParamManager = envParamManager.getResourceParamManager(constants_1.categoryName, resourceName);
        if (service === "Lambda") {
            if (sourceEnv && isNewEnv) {
                const groupName = sourceEnvResourceParamManager.getParam('GROUP');
                if (groupName) {
                    currentEnvResourceParamManager.setParam('GROUP', groupName);
                }
            }
        }
    });
    amplify_cli_core_1.stateManager.setMeta(projectPath, amplifyMeta);
    await (0, promise_sequential_1.default)(functionTasks);
    if (isNewEnv) {
        const yesFlagSet = lodash_1.default.get(context, ['parameters', 'options', 'yes'], false);
        await (0, environmentVariablesHelper_1.askEnvironmentVariableCarryOrUpdateQuestions)(context, sourceEnv, yesFlagSet);
        await (0, cloneSecretsOnEnvInitHandler_1.cloneSecretsOnEnvInitHandler)(context, sourceEnv, envName);
    }
};
exports.initEnv = initEnv;
const getInvoker = async (context, { handler, resourceName, envVars }) => {
    const resourcePath = path.join(amplify_cli_core_1.pathManager.getBackendDirPath(), constants_1.categoryName, resourceName);
    const { pluginId, functionRuntime } = context.amplify.readBreadcrumbs(constants_1.categoryName, resourceName);
    const runtimeManager = await context.amplify.loadRuntimePlugin(context, pluginId);
    return ({ event }) => runtimeManager.invoke({
        handler,
        event: JSON.stringify(event),
        runtime: functionRuntime,
        srcRoot: resourcePath,
        envVars,
    });
};
exports.getInvoker = getInvoker;
const getBuilder = (context, resourceName, buildType) => {
    const meta = amplify_cli_core_1.stateManager.getMeta();
    const lastBuildTimestamp = lodash_1.default.get(meta, [constants_1.categoryName, resourceName, buildFunction_1.buildTypeKeyMap[buildType]]);
    const lastBuildType = lodash_1.default.get(meta, [constants_1.categoryName, resourceName, 'lastBuildType']);
    return async () => {
        await (0, buildFunction_1.buildFunction)(context, {
            resourceName,
            buildType,
            lastBuildTimestamp,
            lastBuildType,
        });
    };
};
exports.getBuilder = getBuilder;
const isMockable = (context, resourceName) => {
    const resourceValue = lodash_1.default.get(context.amplify.getProjectMeta(), [constants_1.categoryName, resourceName]);
    if (!resourceValue) {
        return {
            isMockable: false,
            reason: `Could not find the specified ${constants_1.categoryName}: ${resourceName}`,
        };
    }
    const { service, dependsOn } = resourceValue;
    const dependsOnLayers = Array.isArray(dependsOn)
        ? dependsOn
            .filter((dependency) => dependency.category === constants_1.categoryName)
            .map((val) => lodash_1.default.get(context.amplify.getProjectMeta(), [val.category, val.resourceName]))
            .filter((val) => val.service === "LambdaLayer")
        : [];
    const hasLayer = service === "Lambda" && Array.isArray(dependsOnLayers) && dependsOnLayers.length !== 0;
    if (hasLayer) {
        return {
            isMockable: false,
            reason: 'Mocking a function with layers is not supported. ' +
                'To test in the cloud: run "amplify push" to deploy your function to the cloud ' +
                'and then run "amplify console function" to test your function in the Lambda console.',
        };
    }
    return supported_services_1.supportedServices[service].providerController.isMockable(service);
};
exports.isMockable = isMockable;
const executeAmplifyCommand = async (context) => {
    await (0, amplify_environment_parameters_1.ensureEnvParamManager)();
    let commandPath = path.normalize(path.join(__dirname, 'commands'));
    if (context.input.command === 'help') {
        commandPath = path.join(commandPath, constants_1.categoryName);
    }
    else {
        commandPath = path.join(commandPath, constants_1.categoryName, context.input.command);
    }
    const commandModule = require(commandPath);
    await commandModule.run(context);
};
exports.executeAmplifyCommand = executeAmplifyCommand;
const handleAmplifyEvent = async (context, args) => {
    var _a;
    switch (args.event) {
        case 'PrePush':
            await (0, prePushHandler_1.prePushHandler)(context);
            break;
        case 'PostPush':
            await (0, postPushHandler_1.postPushHandler)(context);
            break;
        case 'InternalOnlyPostEnvRemove':
            await (0, postEnvRemoveHandler_1.postEnvRemoveHandler)(context, (_a = args === null || args === void 0 ? void 0 : args.data) === null || _a === void 0 ? void 0 : _a.envName);
            break;
        case 'PreExport':
            await (0, preExportHandler_1.preExportHandler)();
            break;
        default:
    }
};
exports.handleAmplifyEvent = handleAmplifyEvent;
const lambdaLayerPrompt = async (context, resources) => {
    const lambdaLayerResource = getLambdaLayerResources(resources);
    await (0, packageLayer_1.checkContentChanges)(context, lambdaLayerResource);
};
exports.lambdaLayerPrompt = lambdaLayerPrompt;
const getLambdaLayerResources = (resources) => resources.filter((r) => r.service === "LambdaLayer" && r.category === constants_1.categoryName);
const postPushCleanup = async (resource, envName) => {
    const lambdaLayerResource = getLambdaLayerResources(resource);
    lambdaLayerResource.forEach((llResource) => {
        (0, layerConfiguration_1.deleteLayerVersionsToBeRemovedByCfn)(llResource.resourceName, envName);
        (0, layerConfiguration_1.deleteLayerVersionPermissionsToBeUpdatedInCfn)(llResource.resourceName, envName);
    });
};
exports.postPushCleanup = postPushCleanup;
//# sourceMappingURL=index.js.map