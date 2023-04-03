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
exports.console = exports.updateConfigOnEnvInit = exports.getPermissionPolicies = exports.migrateResource = exports.updateResource = exports.addResource = exports.importResource = void 0;
const amplify_environment_parameters_1 = require("@aws-amplify/amplify-environment-parameters");
const amplify_cli_core_1 = require("amplify-cli-core");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const lodash_1 = __importDefault(require("lodash"));
const constants_1 = require("../../constants");
const import_dynamodb_1 = require("./import/import-dynamodb");
const import_s3_1 = require("./import/import-s3");
var import_1 = require("./import");
Object.defineProperty(exports, "importResource", { enumerable: true, get: function () { return import_1.importResource; } });
const addResource = async (context, category, service, options) => {
    var _a;
    const serviceMetadata = (await Promise.resolve().then(() => __importStar(require('../supported-services')))).supportedServices[service];
    const { defaultValuesFilename, serviceWalkthroughFilename } = serviceMetadata;
    const serviceWalkthroughSrc = `${__dirname}/service-walkthroughs/${serviceWalkthroughFilename}`;
    const { addWalkthrough } = await (_a = serviceWalkthroughSrc, Promise.resolve().then(() => __importStar(require(_a))));
    return addWalkthrough(context, defaultValuesFilename, serviceMetadata, options).then(async (resourceName) => {
        context.amplify.updateamplifyMetaAfterResourceAdd(category, resourceName, options);
        return resourceName;
    });
};
exports.addResource = addResource;
const updateResource = async (context, category, service) => {
    var _a;
    const serviceMetadata = (await Promise.resolve().then(() => __importStar(require('../supported-services')))).supportedServices[service];
    const { defaultValuesFilename, serviceWalkthroughFilename } = serviceMetadata;
    const serviceWalkthroughSrc = `${__dirname}/service-walkthroughs/${serviceWalkthroughFilename}`;
    const { updateWalkthrough } = await (_a = serviceWalkthroughSrc, Promise.resolve().then(() => __importStar(require(_a))));
    if (!updateWalkthrough) {
        const errMessage = 'Update functionality not available for this service';
        amplify_prompts_1.printer.error(errMessage);
        await context.usageData.emitError(new amplify_cli_core_1.NotImplementedError(errMessage));
        (0, amplify_cli_core_1.exitOnNextTick)(0);
    }
    return updateWalkthrough(context, defaultValuesFilename, serviceMetadata);
};
exports.updateResource = updateResource;
const migrateResource = async (context, projectPath, service, resourceName) => {
    var _a;
    const serviceMetadata = (await Promise.resolve().then(() => __importStar(require('../supported-services')))).supportedServices[service];
    const { serviceWalkthroughFilename } = serviceMetadata;
    const serviceWalkthroughSrc = `${__dirname}/service-walkthroughs/${serviceWalkthroughFilename}`;
    const { migrate } = await (_a = serviceWalkthroughSrc, Promise.resolve().then(() => __importStar(require(_a))));
    if (!migrate) {
        amplify_prompts_1.printer.info(`No migration required for ${resourceName}`);
        return;
    }
    return migrate(context, projectPath, resourceName);
};
exports.migrateResource = migrateResource;
const getPermissionPolicies = async (service, resourceName, crudOptions) => {
    var _a;
    const serviceMetadata = (await Promise.resolve().then(() => __importStar(require('../supported-services')))).supportedServices[service];
    const { serviceWalkthroughFilename } = serviceMetadata;
    const serviceWalkthroughSrc = `${__dirname}/service-walkthroughs/${serviceWalkthroughFilename}`;
    const { getIAMPolicies } = await (_a = serviceWalkthroughSrc, Promise.resolve().then(() => __importStar(require(_a))));
    return getIAMPolicies(resourceName, crudOptions);
};
exports.getPermissionPolicies = getPermissionPolicies;
const updateConfigOnEnvInit = async (context, category, resourceName, service) => {
    const serviceMetadata = (await Promise.resolve().then(() => __importStar(require('../supported-services')))).supportedServices[service];
    const { provider } = serviceMetadata;
    const providerPlugin = context.amplify.getPluginInstance(context, provider);
    await (0, amplify_environment_parameters_1.ensureEnvParamManager)();
    const resourceParams = providerPlugin.loadResourceParameters(context, category, resourceName);
    const currentEnvSpecificValues = context.amplify.loadEnvResourceParameters(context, category, resourceName);
    const resource = lodash_1.default.get(context.exeInfo, ['amplifyMeta', category, resourceName]);
    if (resource && resource.serviceType === 'imported') {
        let envSpecificParametersResult;
        const envInitFunction = service === 'S3' ? import_s3_1.importedS3EnvInit : import_dynamodb_1.importedDynamoDBEnvInit;
        const { doServiceWalkthrough, succeeded, envSpecificParameters } = await envInitFunction(context, resourceName, resource, resourceParams, provider, providerPlugin, currentEnvSpecificValues, isInHeadlessMode(context), isInHeadlessMode(context) ? getHeadlessParams(context) : {});
        if (doServiceWalkthrough === true) {
            const importFunction = service === 'S3' ? import_s3_1.importS3 : import_dynamodb_1.importDynamoDB;
            const importResult = await importFunction(context, {
                providerName: provider,
                provider: undefined,
                service,
            }, resourceParams, providerPlugin, false);
            if (importResult) {
                envSpecificParametersResult = importResult.envSpecificParameters;
            }
            else {
                throw new Error('There was an error importing the previously configured storage configuration to the new environment.');
            }
        }
        else if (succeeded) {
            envSpecificParametersResult = envSpecificParameters;
        }
        else {
            throw new Error('There was an error importing the previously configured storage configuration to the new environment.');
        }
        const currentMeta = amplify_cli_core_1.stateManager.getCurrentMeta(undefined, {
            throwIfNotExist: false,
        });
        if (currentMeta) {
            const meta = amplify_cli_core_1.stateManager.getMeta(undefined, {
                throwIfNotExist: false,
            });
            const cloudTimestamp = lodash_1.default.get(currentMeta, [category, resourceName, 'lastPushTimeStamp'], undefined);
            if (cloudTimestamp) {
                resource.lastPushTimeStamp = cloudTimestamp;
            }
            else {
                resource.lastPushTimeStamp = new Date();
            }
            lodash_1.default.setWith(meta, [category, resourceName, 'lastPushTimeStamp'], cloudTimestamp);
            amplify_cli_core_1.stateManager.setMeta(undefined, meta);
        }
        return envSpecificParametersResult;
    }
};
exports.updateConfigOnEnvInit = updateConfigOnEnvInit;
const isInHeadlessMode = (context) => {
    return context.exeInfo.inputParams.yes;
};
const getHeadlessParams = (context) => {
    try {
        const { categories = {} } = context.exeInfo.inputParams;
        return categories.storage || {};
    }
    catch (err) {
        throw new Error(`Failed to parse storage headless parameters: ${err}`);
    }
};
const console = async (amplifyMeta, provider, service) => {
    if (service === amplify_cli_core_1.AmplifySupportedService.S3) {
        const s3Resource = Object.values(amplifyMeta[constants_1.categoryName])
            .filter((resource) => resource.service === service)
            .pop();
        if (!s3Resource) {
            const errMessage = 'No S3 resources to open. You need to add a resource.';
            amplify_prompts_1.printer.error(errMessage);
            return;
        }
        const { BucketName: bucket, Region: region } = s3Resource.output;
        const url = `https://s3.console.aws.amazon.com/s3/buckets/${bucket}?region=${region}`;
        await (0, amplify_cli_core_1.open)(url, { wait: false });
    }
    else if (service === amplify_cli_core_1.AmplifySupportedService.DYNAMODB) {
        const tables = Object.values(amplifyMeta[constants_1.categoryName])
            .filter((resource) => resource.service === service)
            .map((resource) => ({
            name: resource.output.Name,
            value: { tableName: resource.output.Name, region: resource.output.Region },
        }));
        if (!tables.length) {
            const errMessage = 'No DynamoDB tables to open. You need to add a resource.';
            amplify_prompts_1.printer.error(errMessage);
            return;
        }
        const { tableName, region } = await amplify_prompts_1.prompter.pick('Select DynamoDB table to open on your browser', tables);
        const url = `https://${region}.console.aws.amazon.com/dynamodbv2/home?region=${region}#table?name=${tableName}&tab=overview`;
        await (0, amplify_cli_core_1.open)(url, { wait: false });
    }
};
exports.console = console;
//# sourceMappingURL=index.js.map