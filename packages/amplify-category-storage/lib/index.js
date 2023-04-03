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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.initEnv = exports.handleAmplifyEvent = exports.executeAmplifyHeadlessCommand = exports.executeAmplifyCommand = exports.getPermissionPolicies = exports.canResourceBeTransformed = exports.transformCategoryStack = exports.migrateStorageCategory = exports.console = exports.add = exports.getDefaultAuthPermissions = exports.s3GetBucketUserInputDefault = exports.s3RemoveStorageLambdaTrigger = exports.s3RemoveAdminLambdaTrigger = exports.s3RegisterAdminTrigger = exports.s3GetUserInput = exports.s3GetResourceName = exports.s3CreateStorageResource = exports.s3AddStorageLambdaTrigger = exports.category = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const amplify_util_headless_input_1 = require("amplify-util-headless-input");
const path = __importStar(require("path"));
const promise_sequential_1 = __importDefault(require("promise-sequential"));
const constants_1 = require("./constants");
const awscloudformation_1 = require("./provider-utils/awscloudformation");
const ddb_stack_transform_1 = require("./provider-utils/awscloudformation/cdk-stack-builder/ddb-stack-transform");
const s3_stack_transform_1 = require("./provider-utils/awscloudformation/cdk-stack-builder/s3-stack-transform");
const s3_defaults_1 = require("./provider-utils/awscloudformation/default-values/s3-defaults");
const s3_user_input_types_1 = require("./provider-utils/awscloudformation/service-walkthrough-types/s3-user-input-types");
const dynamoDB_input_state_1 = require("./provider-utils/awscloudformation/service-walkthroughs/dynamoDB-input-state");
const storage_configuration_helpers_1 = require("./provider-utils/awscloudformation/storage-configuration-helpers");
var constants_2 = require("./constants");
Object.defineProperty(exports, "category", { enumerable: true, get: function () { return constants_2.categoryName; } });
var s3_resource_api_1 = require("./provider-utils/awscloudformation/service-walkthroughs/s3-resource-api");
Object.defineProperty(exports, "s3AddStorageLambdaTrigger", { enumerable: true, get: function () { return s3_resource_api_1.s3AddStorageLambdaTrigger; } });
Object.defineProperty(exports, "s3CreateStorageResource", { enumerable: true, get: function () { return s3_resource_api_1.s3CreateStorageResource; } });
Object.defineProperty(exports, "s3GetResourceName", { enumerable: true, get: function () { return s3_resource_api_1.s3GetResourceName; } });
Object.defineProperty(exports, "s3GetUserInput", { enumerable: true, get: function () { return s3_resource_api_1.s3GetUserInput; } });
Object.defineProperty(exports, "s3RegisterAdminTrigger", { enumerable: true, get: function () { return s3_resource_api_1.s3RegisterAdminTrigger; } });
Object.defineProperty(exports, "s3RemoveAdminLambdaTrigger", { enumerable: true, get: function () { return s3_resource_api_1.s3RemoveAdminLambdaTrigger; } });
Object.defineProperty(exports, "s3RemoveStorageLambdaTrigger", { enumerable: true, get: function () { return s3_resource_api_1.s3RemoveStorageLambdaTrigger; } });
async function s3GetBucketUserInputDefault(project, shortId, accessType) {
    const defaultS3UserInputs = (0, s3_defaults_1.getAllDefaults)(project, shortId);
    switch (accessType) {
        case s3_user_input_types_1.S3AccessType.AUTH_ONLY:
            defaultS3UserInputs.authAccess = [s3_user_input_types_1.S3PermissionType.CREATE_AND_UPDATE, s3_user_input_types_1.S3PermissionType.READ, s3_user_input_types_1.S3PermissionType.DELETE];
            break;
        case s3_user_input_types_1.S3AccessType.AUTH_AND_GUEST:
            defaultS3UserInputs.authAccess = [s3_user_input_types_1.S3PermissionType.CREATE_AND_UPDATE, s3_user_input_types_1.S3PermissionType.READ, s3_user_input_types_1.S3PermissionType.DELETE];
            defaultS3UserInputs.guestAccess = [s3_user_input_types_1.S3PermissionType.CREATE_AND_UPDATE, s3_user_input_types_1.S3PermissionType.READ];
            break;
    }
    return defaultS3UserInputs;
}
exports.s3GetBucketUserInputDefault = s3GetBucketUserInputDefault;
async function getDefaultAuthPermissions() {
    return [s3_user_input_types_1.S3PermissionType.CREATE_AND_UPDATE, s3_user_input_types_1.S3PermissionType.READ, s3_user_input_types_1.S3PermissionType.DELETE];
}
exports.getDefaultAuthPermissions = getDefaultAuthPermissions;
async function add(context, providerName, service) {
    const options = {
        service,
        providerPlugin: providerName,
    };
    const providerController = require(`./provider-utils/${providerName}`);
    if (!providerController) {
        amplify_prompts_1.printer.error('Provider not configured for this category');
        return undefined;
    }
    return providerController.addResource(context, amplify_cli_core_1.AmplifyCategories.STORAGE, service, options);
}
exports.add = add;
const console = async (context) => {
    var _a, _b;
    const { amplify } = context;
    const amplifyMeta = amplify_cli_core_1.stateManager.getMeta();
    if (!amplifyMeta.storage || Object.keys(amplifyMeta.storage).length === 0) {
        amplify_prompts_1.printer.error('Storage has NOT been added to this project.');
        return;
    }
    const nameOverrides = {
        S3: 'S3 bucket - Content (Images, audio, video, etc.)',
        DynamoDB: 'DynamoDB table - NoSQL Database',
    };
    const servicesMetadata = (await (_a = path.join(__dirname, 'provider-utils', 'supported-services'), Promise.resolve().then(() => __importStar(require(_a))))).supportedServices;
    const serviceSelection = await amplify.serviceSelectionPrompt(context, constants_1.categoryName, servicesMetadata, undefined, nameOverrides);
    const providerController = await (_b = path.join(__dirname, 'provider-utils', serviceSelection.providerName, 'index'), Promise.resolve().then(() => __importStar(require(_b))));
    if (!providerController) {
        amplify_prompts_1.printer.error('Provider not configured for this category');
        return;
    }
    await providerController.console(amplifyMeta, serviceSelection.providerName, serviceSelection.service);
};
exports.console = console;
async function migrateStorageCategory(context) {
    const { projectPath, amplifyMeta } = context.migrationInfo;
    const migrateResourcePromises = [];
    Object.keys(amplifyMeta).forEach((categoryName) => {
        if (categoryName === amplify_cli_core_1.AmplifyCategories.STORAGE) {
            Object.keys(amplifyMeta[amplify_cli_core_1.AmplifyCategories.STORAGE]).forEach((resourceName) => {
                try {
                    const providerController = require(`./provider-utils/${amplifyMeta[amplify_cli_core_1.AmplifyCategories.STORAGE][resourceName].providerPlugin}`);
                    if (providerController) {
                        migrateResourcePromises.push(providerController.migrateResource(context, projectPath, amplifyMeta[amplify_cli_core_1.AmplifyCategories.STORAGE][resourceName].service, resourceName));
                    }
                    else {
                        amplify_prompts_1.printer.error(`Provider not configured for ${amplify_cli_core_1.AmplifyCategories.STORAGE}: ${resourceName}`);
                    }
                }
                catch (e) {
                    amplify_prompts_1.printer.warn(`Could not run migration for ${amplify_cli_core_1.AmplifyCategories.STORAGE}: ${resourceName}`);
                    throw e;
                }
            });
        }
    });
    await Promise.all(migrateResourcePromises);
}
exports.migrateStorageCategory = migrateStorageCategory;
async function transformCategoryStack(context, resource) {
    if (resource.service === amplify_cli_core_1.AmplifySupportedService.DYNAMODB) {
        if (canResourceBeTransformed(context, resource.resourceName)) {
            const stackGenerator = new ddb_stack_transform_1.DDBStackTransform(context, resource.resourceName);
            await stackGenerator.transform();
        }
    }
    else if (resource.service === amplify_cli_core_1.AmplifySupportedService.S3) {
        await (0, s3_stack_transform_1.transformS3ResourceStack)(context, resource);
    }
}
exports.transformCategoryStack = transformCategoryStack;
function canResourceBeTransformed(context, resourceName) {
    const resourceInputState = new dynamoDB_input_state_1.DynamoDBInputState(context, resourceName);
    return resourceInputState.cliInputFileExists();
}
exports.canResourceBeTransformed = canResourceBeTransformed;
async function getPermissionPolicies(context, resourceOpsMapping) {
    const amplifyMetaFilePath = context.amplify.pathManager.getAmplifyMetaFilePath();
    const amplifyMeta = context.amplify.readJsonFile(amplifyMetaFilePath);
    const permissionPolicies = [];
    const resourceAttributes = [];
    const storageCategory = amplify_cli_core_1.AmplifyCategories.STORAGE;
    for (const resourceName of Object.keys(resourceOpsMapping)) {
        try {
            const providerPlugin = 'providerPlugin' in resourceOpsMapping[resourceName]
                ? resourceOpsMapping[resourceName].providerPlugin
                : amplifyMeta[storageCategory][resourceName].providerPlugin;
            const service = 'service' in resourceOpsMapping[resourceName]
                ? resourceOpsMapping[resourceName].service
                : amplifyMeta[storageCategory][resourceName].service;
            if (providerPlugin) {
                const providerController = await (_a = `./provider-utils/${providerPlugin}`, Promise.resolve().then(() => __importStar(require(_a))));
                const { policy, attributes } = await providerController.getPermissionPolicies(service, resourceName, resourceOpsMapping[resourceName]);
                if (Array.isArray(policy)) {
                    permissionPolicies.push(...policy);
                }
                else {
                    permissionPolicies.push(policy);
                }
                resourceAttributes.push({ resourceName, attributes, category: storageCategory });
            }
            else {
                amplify_prompts_1.printer.error(`Provider not configured for ${storageCategory}: ${resourceName}`);
            }
        }
        catch (e) {
            amplify_prompts_1.printer.warn(`Could not get policies for ${storageCategory}: ${resourceName}`);
            throw e;
        }
    }
    return { permissionPolicies, resourceAttributes };
}
exports.getPermissionPolicies = getPermissionPolicies;
async function executeAmplifyCommand(context) {
    let commandPath = path.normalize(path.join(__dirname, 'commands'));
    if (context.input.command === 'help') {
        commandPath = path.join(commandPath, amplify_cli_core_1.AmplifyCategories.STORAGE);
    }
    else {
        commandPath = path.join(commandPath, amplify_cli_core_1.AmplifyCategories.STORAGE, context.input.command);
    }
    const commandModule = require(commandPath);
    await commandModule.run(context);
}
exports.executeAmplifyCommand = executeAmplifyCommand;
const executeAmplifyHeadlessCommand = async (context, headlessPayload) => {
    context.usageData.pushHeadlessFlow(headlessPayload, context.input);
    switch (context.input.command) {
        case 'add':
            await (0, storage_configuration_helpers_1.headlessAddStorage)(context, await (0, amplify_util_headless_input_1.validateAddStorageRequest)(headlessPayload));
            break;
        case 'update':
            await (0, storage_configuration_helpers_1.headlessUpdateStorage)(context, await (0, amplify_util_headless_input_1.validateUpdateStorageRequest)(headlessPayload));
            break;
        case 'remove':
            await (0, storage_configuration_helpers_1.headlessRemoveStorage)(context, await (0, amplify_util_headless_input_1.validateRemoveStorageRequest)(headlessPayload));
            break;
        case 'import':
            await (0, storage_configuration_helpers_1.headlessImportStorage)(context, await (0, amplify_util_headless_input_1.validateImportStorageRequest)(headlessPayload));
            break;
        default:
            amplify_prompts_1.printer.error(`Headless mode for ${context.input.command} storage is not implemented yet`);
    }
};
exports.executeAmplifyHeadlessCommand = executeAmplifyHeadlessCommand;
async function handleAmplifyEvent(context, args) {
    amplify_prompts_1.printer.info(`${constants_1.categoryName} handleAmplifyEvent to be implemented`);
    amplify_prompts_1.printer.info(`Received event args ${args}`);
}
exports.handleAmplifyEvent = handleAmplifyEvent;
async function initEnv(context) {
    const { resourcesToBeSynced, allResources } = await context.amplify.getResourceStatus(amplify_cli_core_1.AmplifyCategories.STORAGE);
    const isPulling = context.input.command === 'pull' || (context.input.command === 'env' && context.input.subCommands[0] === 'pull');
    let toBeSynced = [];
    if (resourcesToBeSynced && resourcesToBeSynced.length > 0) {
        toBeSynced = resourcesToBeSynced.filter((b) => b.category === amplify_cli_core_1.AmplifyCategories.STORAGE);
    }
    toBeSynced
        .filter((storageResource) => storageResource.sync === 'unlink')
        .forEach((storageResource) => {
        context.amplify.removeResourceParameters(context, amplify_cli_core_1.AmplifyCategories.STORAGE, storageResource.resourceName);
    });
    let tasks = [];
    if (!isPulling) {
        tasks = tasks.concat(toBeSynced);
    }
    if (isPulling && allResources.length > 0) {
        tasks.push(...allResources);
    }
    const storageTasks = tasks.map((storageResource) => {
        const { resourceName, service } = storageResource;
        return async () => {
            const config = await (0, awscloudformation_1.updateConfigOnEnvInit)(context, amplify_cli_core_1.AmplifyCategories.STORAGE, resourceName, service);
            context.amplify.saveEnvResourceParameters(context, amplify_cli_core_1.AmplifyCategories.STORAGE, resourceName, config);
        };
    });
    await (0, promise_sequential_1.default)(storageTasks);
}
exports.initEnv = initEnv;
//# sourceMappingURL=index.js.map