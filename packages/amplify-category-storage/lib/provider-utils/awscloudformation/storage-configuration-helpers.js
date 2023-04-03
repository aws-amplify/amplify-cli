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
exports.getAuthResourceName = exports.checkIfAuthExists = exports.headlessRemoveStorage = exports.headlessImportStorage = exports.headlessUpdateStorage = exports.headlessAddStorage = exports.permissionMap = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const uuid_1 = require("uuid");
const constants_1 = require("../../constants");
const import_s3_1 = require("./import/import-s3");
const provider_constants_1 = require("./provider-constants");
const s3_headless_adapter_1 = require("./s3-headless-adapter");
const s3_auth_api_1 = require("./service-walkthroughs/s3-auth-api");
const s3_resource_api_1 = require("./service-walkthroughs/s3-resource-api");
const s3_walkthrough_1 = require("./service-walkthroughs/s3-walkthrough");
exports.permissionMap = {
    'create/update': ['s3:PutObject'],
    read: ['s3:GetObject', 's3:ListBucket'],
    delete: ['s3:DeleteObject'],
};
async function headlessAddStorage(context, storageRequest) {
    if (!(0, exports.checkIfAuthExists)()) {
        const error = new Error('Cannot headlessly add storage resource without an existing auth resource. It can be added with "amplify add auth"');
        await context.usageData.emitError(error);
        error.stack = undefined;
        throw error;
    }
    if (storageRequest.serviceConfiguration.serviceName === provider_constants_1.ServiceName.S3) {
        if ((0, s3_walkthrough_1.resourceAlreadyExists)()) {
            const error = new amplify_cli_core_1.ResourceAlreadyExistsError('Amazon S3 storage was already added to your project.');
            await context.usageData.emitError(error);
            error.stack = undefined;
            throw error;
        }
        const meta = amplify_cli_core_1.stateManager.getMeta();
        if (storageRequest.serviceConfiguration.permissions.groups && !doUserPoolGroupsExist(meta)) {
            const error = new Error('No user pool groups found in amplify-meta.json.');
            await context.usageData.emitError(error);
            error.stack = undefined;
            throw error;
        }
        await createS3StorageArtifacts(context, storageRequest);
    }
    else if (storageRequest.serviceConfiguration.serviceName === provider_constants_1.ServiceName.DynamoDB) {
        const error = new Error('Headless support for DynamoDB resources is not yet implemented.');
        await context.usageData.emitError(error);
        error.stack = undefined;
        throw error;
    }
}
exports.headlessAddStorage = headlessAddStorage;
async function headlessUpdateStorage(context, storageRequest) {
    if (storageRequest.serviceModification.serviceName === provider_constants_1.ServiceName.S3) {
        const { serviceModification: { permissions, resourceName }, } = storageRequest;
        const meta = amplify_cli_core_1.stateManager.getMeta();
        const storageResource = meta[constants_1.categoryName][resourceName];
        if (!storageResource || storageResource.service !== provider_constants_1.ServiceName.S3) {
            const error = new amplify_cli_core_1.ResourceDoesNotExistError(`No S3 resource '${resourceName}' found in amplify-meta.json.`);
            await context.usageData.emitError(error);
            error.stack = undefined;
            throw error;
        }
        if (storageResource.mobileHubMigrated === true) {
            const error = new Error(`Updating storage resources migrated from mobile hub is not supported.`);
            await context.usageData.emitError(error);
            error.stack = undefined;
            throw error;
        }
        if (storageResource.serviceType === 'imported') {
            const error = new Error('Updating an imported storage resource is not supported.');
            await context.usageData.emitError(error);
            error.stack = undefined;
            throw error;
        }
        if (permissions.groups && !doUserPoolGroupsExist(meta)) {
            const error = new Error('No user pool groups found in amplify-meta.json.');
            await context.usageData.emitError(error);
            error.stack = undefined;
            throw error;
        }
        await updateS3StorageArtifacts(context, storageRequest);
    }
    else if (storageRequest.serviceModification.serviceName === provider_constants_1.ServiceName.DynamoDB) {
        const error = new Error('Headless support for DynamoDB resources is not yet implemented.');
        await context.usageData.emitError(error);
        error.stack = undefined;
        throw error;
    }
}
exports.headlessUpdateStorage = headlessUpdateStorage;
async function headlessImportStorage(context, storageRequest) {
    const { serviceConfiguration: { bucketName, serviceName }, } = storageRequest;
    if (!(0, exports.checkIfAuthExists)()) {
        const error = new Error('Cannot headlessly import storage resource without an existing auth resource. It can be added with "amplify add auth"');
        await context.usageData.emitError(error);
        error.stack = undefined;
        throw error;
    }
    if (storageRequest.serviceConfiguration.serviceName === provider_constants_1.ServiceName.S3) {
        if ((0, s3_walkthrough_1.resourceAlreadyExists)()) {
            const error = new amplify_cli_core_1.ResourceAlreadyExistsError('Amazon S3 storage was already added to your project.');
            await context.usageData.emitError(error);
            error.stack = undefined;
            throw error;
        }
        const serviceMetadata = (await Promise.resolve().then(() => __importStar(require('../supported-services')))).supportedServices[serviceName];
        const { provider } = serviceMetadata;
        const providerUtils = context.amplify.getPluginInstance(context, provider);
        const s3 = await providerUtils.createS3Service(context);
        const bucketExists = await s3.bucketExists(bucketName);
        if (!bucketExists) {
            const error = new Error(`The specified bucket: "${bucketName}" does not exist.`);
            await context.usageData.emitError(error);
            throw error;
        }
        const bucketRegion = await s3.getBucketLocation(bucketName);
        const projectConfig = context.amplify.getProjectConfig();
        const [shortId] = (0, uuid_1.v4)().split('-');
        const projectName = projectConfig.projectName.toLowerCase().replace(/[^A-Za-z0-9_]+/g, '_');
        const resourceName = `${projectName}${shortId}`;
        const questionParameters = {
            providerName: provider,
            bucketList: [],
            region: bucketRegion,
        };
        const answers = {
            resourceName,
            bucketName,
        };
        await (0, import_s3_1.updateStateFiles)(context, questionParameters, answers, true);
    }
    else if (storageRequest.serviceConfiguration.serviceName === provider_constants_1.ServiceName.DynamoDB) {
        const error = new Error('Headless support for importing DynamoDB resources is not yet implemented.');
        await context.usageData.emitError(error);
        error.stack = undefined;
        throw error;
    }
}
exports.headlessImportStorage = headlessImportStorage;
async function headlessRemoveStorage(context, storageRequest) {
    const { resourceName, deleteBucketAndContents } = storageRequest.serviceConfiguration;
    if (deleteBucketAndContents === true) {
        throw new Error('deleteBucketAndContents is set to true, but the functionality is not yet implemented.');
    }
    try {
        await context.amplify.removeResource(context, constants_1.categoryName, resourceName, { headless: true });
    }
    catch (error) {
        amplify_prompts_1.printer.error(`An error occurred when headlessly removing the storage resource "${resourceName}": ${error.message || error}`);
        await context.usageData.emitError(error);
        process.exitCode = 1;
    }
}
exports.headlessRemoveStorage = headlessRemoveStorage;
async function createS3StorageArtifacts(context, storageRequest) {
    const storageInput = (0, s3_headless_adapter_1.buildS3UserInputFromHeadlessStorageRequest)(context, storageRequest);
    const s3UserInput = await (0, s3_resource_api_1.s3CreateStorageResource)(context, storageInput);
    const allowUnauthenticatedIdentities = storageInput.guestAccess && storageInput.guestAccess.length > 0;
    await (0, s3_auth_api_1.checkStorageAuthenticationRequirements)(context, s3UserInput.resourceName, allowUnauthenticatedIdentities);
    const lambdaConfig = storageRequest.serviceConfiguration.lambdaTrigger;
    if (lambdaConfig) {
        if (lambdaConfig.mode === 'new') {
            const storageLambdaParams = (0, s3_headless_adapter_1.buildTriggerFunctionParams)(lambdaConfig.name);
            await (0, s3_resource_api_1.s3AddStorageLambdaTrigger)(context, storageInput.resourceName, storageLambdaParams);
        }
    }
}
async function updateS3StorageArtifacts(context, updateStorageRequest) {
    const lambdaConfig = updateStorageRequest.serviceModification.lambdaTrigger;
    const storageInput = await (0, s3_headless_adapter_1.buildS3UserInputFromHeadlessUpdateStorageRequest)(context, updateStorageRequest);
    const allowUnauthenticatedIdentities = storageInput.guestAccess && storageInput.guestAccess.length > 0;
    await (0, s3_auth_api_1.checkStorageAuthenticationRequirements)(context, storageInput.resourceName, allowUnauthenticatedIdentities);
    let s3UserInput = await (0, s3_resource_api_1.s3UpdateUserInput)(context, storageInput);
    if (lambdaConfig) {
        if (lambdaConfig.mode === 'new') {
            const storageLambdaParams = (0, s3_headless_adapter_1.buildTriggerFunctionParams)(lambdaConfig.name);
            s3UserInput = await (0, s3_resource_api_1.s3AddStorageLambdaTrigger)(context, storageInput.resourceName, storageLambdaParams);
        }
    }
    return s3UserInput;
}
function doUserPoolGroupsExist(meta) {
    const { userPoolGroups } = meta[constants_1.authCategoryName];
    return userPoolGroups && userPoolGroups.service === 'Cognito-UserPool-Groups';
}
const checkIfAuthExists = () => {
    const amplifyMeta = amplify_cli_core_1.stateManager.getMeta();
    let authExists = false;
    const authServiceName = 'Cognito';
    const authCategory = constants_1.authCategoryName;
    if (amplifyMeta[authCategory] && Object.keys(amplifyMeta[authCategory]).length > 0) {
        const categoryResources = amplifyMeta[authCategory];
        Object.keys(categoryResources).forEach((resource) => {
            if (categoryResources[resource].service === authServiceName) {
                authExists = true;
            }
        });
    }
    return authExists;
};
exports.checkIfAuthExists = checkIfAuthExists;
async function getAuthResourceName(context) {
    let authResources = (await context.amplify.getResourceStatus(constants_1.authCategoryName)).allResources;
    authResources = authResources.filter((resource) => resource.service === 'Cognito');
    if (authResources.length === 0) {
        throw new Error('No auth resource found. Please add it using amplify add auth');
    }
    return authResources[0].resourceName;
}
exports.getAuthResourceName = getAuthResourceName;
//# sourceMappingURL=storage-configuration-helpers.js.map