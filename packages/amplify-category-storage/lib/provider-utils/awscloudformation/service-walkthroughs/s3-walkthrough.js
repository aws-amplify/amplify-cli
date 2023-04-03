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
exports.getIAMPolicies = exports.checkIfAuthExists = exports.resourceAlreadyExists = exports.S3CLITriggerStateEvent = exports.S3CLITriggerFlow = exports.createNewLambdaAndUpdateCFN = exports.addTrigger = exports.buildShortUUID = exports.migrateStorageCategory = exports.isMigrateStorageRequired = exports.updateWalkthrough = exports.addWalkthrough = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const uuid_1 = require("uuid");
const s3_stack_transform_1 = require("../cdk-stack-builder/s3-stack-transform");
const s3_defaults_1 = require("../default-values/s3-defaults");
const s3_user_input_types_1 = require("../service-walkthrough-types/s3-user-input-types");
const s3_auth_api_1 = require("./s3-auth-api");
const s3_errors_1 = require("./s3-errors");
const s3_questions_1 = require("./s3-questions");
const s3_resource_api_1 = require("./s3-resource-api");
const s3_user_input_state_1 = require("./s3-user-input-state");
async function addWalkthrough(context, defaultValuesFilename, serviceMetadata, options) {
    const { amplify } = context;
    const amplifyMeta = amplify_cli_core_1.stateManager.getMeta();
    try {
        const authMigrationAccepted = await (0, s3_auth_api_1.migrateAuthDependencyResource)(context);
        if (!authMigrationAccepted) {
            (0, amplify_cli_core_1.exitOnNextTick)(0);
        }
    }
    catch (error) {
        await (0, s3_errors_1.printErrorAuthResourceMigrationFailed)(context);
        (0, amplify_cli_core_1.exitOnNextTick)(0);
    }
    await (0, s3_questions_1.askAndInvokeAuthWorkflow)(context);
    const resourceName = await getS3ResourceNameFromMeta(amplifyMeta);
    if (resourceName) {
        await (0, s3_errors_1.printErrorAlreadyCreated)(context);
        (0, amplify_cli_core_1.exitOnNextTick)(0);
    }
    else {
        const policyID = buildShortUUID();
        const defaultValues = (0, s3_defaults_1.getAllDefaults)(amplify.getProjectDetails(), policyID);
        const storageResourceName = await (0, s3_questions_1.askResourceNameQuestion)(context, defaultValues);
        const bucketName = await (0, s3_questions_1.askBucketNameQuestion)(context, defaultValues);
        let cliInputs = Object.assign({}, defaultValues);
        cliInputs.policyUUID = policyID;
        cliInputs.resourceName = storageResourceName;
        cliInputs.bucketName = bucketName;
        const userPoolGroupList = context.amplify.getUserPoolGroupList();
        if (userPoolGroupList && userPoolGroupList.length > 0) {
            cliInputs = await (0, s3_questions_1.askGroupOrIndividualAccessFlow)(userPoolGroupList, context, cliInputs);
        }
        else {
            cliInputs.storageAccess = await await (0, s3_questions_1.askWhoHasAccessQuestion)(context, defaultValues);
            cliInputs.authAccess = await (0, s3_questions_1.askAuthPermissionQuestion)(context, defaultValues);
            cliInputs.guestAccess = await await (0, s3_questions_1.conditionallyAskGuestPermissionQuestion)(cliInputs.storageAccess, context, defaultValues);
        }
        const triggerFunction = await startAddTriggerFunctionFlow(context, storageResourceName, policyID, undefined);
        cliInputs.triggerFunction = triggerFunction ? triggerFunction : 'NONE';
        const allowUnauthenticatedIdentities = cliInputs.guestAccess && cliInputs.guestAccess.length > 0;
        await (0, s3_auth_api_1.checkStorageAuthenticationRequirements)(context, storageResourceName, allowUnauthenticatedIdentities);
        const cliInputsState = new s3_user_input_state_1.S3InputState(context, cliInputs.resourceName, cliInputs);
        await cliInputsState.saveCliInputPayload(cliInputs);
        const stackGenerator = new s3_stack_transform_1.AmplifyS3ResourceStackTransform(cliInputs.resourceName, context);
        await stackGenerator.transform(amplify_cli_core_1.CLISubCommandType.ADD);
        const dependsOn = stackGenerator.getS3DependsOn();
        if (dependsOn) {
            options.dependsOn = dependsOn;
        }
        return cliInputs.resourceName;
    }
    return undefined;
}
exports.addWalkthrough = addWalkthrough;
async function updateWalkthrough(context) {
    var _a, _b, _c;
    const amplifyMeta = amplify_cli_core_1.stateManager.getMeta();
    const storageResourceName = await getS3ResourceNameFromMeta(amplifyMeta);
    if (storageResourceName === undefined) {
        await (0, s3_errors_1.printErrorNoResourcesToUpdate)(context);
        (0, amplify_cli_core_1.exitOnNextTick)(0);
    }
    else {
        if (amplifyMeta[amplify_cli_core_1.AmplifyCategories.STORAGE][storageResourceName].serviceType === 'imported') {
            amplify_prompts_1.printer.error('Updating of an imported storage resource is not supported.');
            return undefined;
        }
        const cliInputsState = new s3_user_input_state_1.S3InputState(context, storageResourceName, undefined);
        const headlessMigrate = ((_a = context.input.options) === null || _a === void 0 ? void 0 : _a.yes) || ((_b = context.input.options) === null || _b === void 0 ? void 0 : _b.forcePush) || ((_c = context.input.options) === null || _c === void 0 ? void 0 : _c.headless);
        if (!cliInputsState.cliInputFileExists()) {
            if (headlessMigrate ||
                (await amplify_prompts_1.prompter.yesOrNo((0, amplify_cli_core_1.getMigrateResourceMessageForOverride)(amplify_cli_core_1.AmplifyCategories.STORAGE, storageResourceName), true))) {
                await cliInputsState.migrate(context);
                const stackGenerator = new s3_stack_transform_1.AmplifyS3ResourceStackTransform(storageResourceName, context);
                await stackGenerator.transform(amplify_cli_core_1.CLISubCommandType.UPDATE);
            }
            else {
                return undefined;
            }
        }
        const previousUserInput = cliInputsState.getUserInput();
        let cliInputs = Object.assign({}, previousUserInput);
        const userPoolGroupList = context.amplify.getUserPoolGroupList();
        if (userPoolGroupList && userPoolGroupList.length > 0) {
            cliInputs = await (0, s3_questions_1.askGroupOrIndividualAccessFlow)(userPoolGroupList, context, cliInputs);
        }
        else {
            cliInputs.storageAccess = await (0, s3_questions_1.askWhoHasAccessQuestion)(context, previousUserInput);
            cliInputs.authAccess = await (0, s3_questions_1.askAuthPermissionQuestion)(context, previousUserInput);
            cliInputs.guestAccess = await (0, s3_questions_1.conditionallyAskGuestPermissionQuestion)(cliInputs.storageAccess, context, previousUserInput);
        }
        if (previousUserInput.triggerFunction && previousUserInput.triggerFunction != 'NONE') {
            cliInputs.triggerFunction = await startUpdateTriggerFunctionFlow(context, storageResourceName, previousUserInput.policyUUID, previousUserInput.triggerFunction);
        }
        else {
            cliInputs.triggerFunction = await startAddTriggerFunctionFlow(context, storageResourceName, previousUserInput.policyUUID, undefined);
        }
        const allowUnauthenticatedIdentities = cliInputs.guestAccess && cliInputs.guestAccess.length > 0;
        await (0, s3_auth_api_1.checkStorageAuthenticationRequirements)(context, storageResourceName, allowUnauthenticatedIdentities);
        await cliInputsState.saveCliInputPayload(cliInputs);
        const stackGenerator = new s3_stack_transform_1.AmplifyS3ResourceStackTransform(cliInputs.resourceName, context);
        await stackGenerator.transform(amplify_cli_core_1.CLISubCommandType.UPDATE);
        return cliInputs.resourceName;
    }
    return undefined;
}
exports.updateWalkthrough = updateWalkthrough;
function isMigrateStorageRequired(context, resourceName) {
    const projectBackendDirPath = amplify_cli_core_1.pathManager.getBackendDirPath();
    const cliInputsFilePath = path.resolve(path.join(projectBackendDirPath, amplify_cli_core_1.AmplifyCategories.STORAGE, resourceName, 'cli-inputs.json'));
    return !fs.existsSync(cliInputsFilePath);
}
exports.isMigrateStorageRequired = isMigrateStorageRequired;
async function migrateStorageCategory(context, resourceName) {
    const cliInputsState = new s3_user_input_state_1.S3InputState(context, resourceName, undefined);
    if (!cliInputsState.cliInputFileExists()) {
        await cliInputsState.migrate(context);
        const stackGenerator = new s3_stack_transform_1.AmplifyS3ResourceStackTransform(resourceName, context);
        await stackGenerator.transform(amplify_cli_core_1.CLISubCommandType.MIGRATE);
        return stackGenerator.getCFN();
    }
    else {
        return undefined;
    }
}
exports.migrateStorageCategory = migrateStorageCategory;
function buildShortUUID() {
    const [shortId] = (0, uuid_1.v4)().split('-');
    return shortId;
}
exports.buildShortUUID = buildShortUUID;
async function startAddTriggerFunctionFlow(context, resourceName, policyID, existingTriggerFunction) {
    const enableLambdaTriggerOnS3 = await amplify_prompts_1.prompter.yesOrNo('Do you want to add a Lambda Trigger for your S3 Bucket?', false);
    let triggerFunction = undefined;
    if (enableLambdaTriggerOnS3) {
        try {
            triggerFunction = await addTrigger(S3CLITriggerFlow.ADD, context, resourceName, policyID, existingTriggerFunction);
        }
        catch (e) {
            amplify_prompts_1.printer.error(e.message);
        }
    }
    return triggerFunction;
}
async function startUpdateTriggerFunctionFlow(context, resourceName, policyID, existingTriggerFunction) {
    let triggerFunction = existingTriggerFunction;
    let continueWithTriggerOperationQuestion = true;
    do {
        const triggerOperationAnswer = await (0, s3_questions_1.askUpdateTriggerSelection)(existingTriggerFunction);
        switch (triggerOperationAnswer) {
            case s3_questions_1.S3CLITriggerUpdateMenuOptions.ADD:
            case s3_questions_1.S3CLITriggerUpdateMenuOptions.UPDATE: {
                try {
                    triggerFunction = await addTrigger(S3CLITriggerFlow.UPDATE, context, resourceName, policyID, existingTriggerFunction);
                    continueWithTriggerOperationQuestion = false;
                }
                catch (e) {
                    amplify_prompts_1.printer.error(e.message);
                    continueWithTriggerOperationQuestion = true;
                }
                break;
            }
            case s3_questions_1.S3CLITriggerUpdateMenuOptions.REMOVE: {
                if (triggerFunction) {
                    await removeTriggerPolicy(context, resourceName, triggerFunction);
                    triggerFunction = undefined;
                    continueWithTriggerOperationQuestion = false;
                }
                break;
            }
            case s3_questions_1.S3CLITriggerUpdateMenuOptions.SKIP: {
                continueWithTriggerOperationQuestion = false;
                break;
            }
            default:
                amplify_prompts_1.printer.error(`${triggerOperationAnswer} not supported`);
                continueWithTriggerOperationQuestion = false;
        }
    } while (continueWithTriggerOperationQuestion);
    return triggerFunction;
}
async function addTrigger(triggerFlowType, context, resourceName, policyID, existingTriggerFunction) {
    const triggerStateEvent = getCLITriggerStateEvent(triggerFlowType, existingTriggerFunction);
    let triggerFunction = existingTriggerFunction;
    switch (triggerStateEvent) {
        case S3CLITriggerStateEvent.ERROR:
            throw new Error("Lambda Trigger is already enabled, please use 'amplify update storage'");
        case S3CLITriggerStateEvent.ADD_NEW_TRIGGER: {
            const existingLambdaResources = await getExistingFunctionsForTrigger(context, existingTriggerFunction, false);
            if (existingLambdaResources && existingLambdaResources.length > 0) {
                triggerFunction = await interactiveAskTriggerTypeFlow(context, policyID, existingTriggerFunction, existingLambdaResources);
            }
            else {
                triggerFunction = await interactiveCreateNewLambdaAndUpdateCFN(context);
            }
            break;
        }
        case S3CLITriggerStateEvent.REPLACE_TRIGGER:
            triggerFunction = await interactiveAskTriggerTypeFlow(context, policyID, existingTriggerFunction);
            break;
        case S3CLITriggerStateEvent.DELETE_TRIGGER:
            triggerFunction = undefined;
            break;
    }
    return triggerFunction;
}
exports.addTrigger = addTrigger;
async function removeTriggerPolicy(context, resourceName, triggerFunction) {
    const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();
    const functionCFNFilePath = path.join(projectBackendDirPath, 'function', triggerFunction, `${triggerFunction}-cloudformation-template.json`);
    if (fs.existsSync(functionCFNFilePath)) {
        const functionCFNFile = context.amplify.readJsonFile(functionCFNFilePath);
        delete functionCFNFile.Resources[`${resourceName}TriggerPolicy`];
        delete functionCFNFile.Resources[`${resourceName}Trigger`];
        const functionCFNString = JSON.stringify(functionCFNFile, null, 4);
        fs.writeFileSync(functionCFNFilePath, functionCFNString, 'utf8');
    }
    return triggerFunction;
}
async function getS3ResourceNameFromMeta(amplifyMeta) {
    const storageResources = getS3ResourcesFromAmplifyMeta(amplifyMeta);
    if (storageResources) {
        if (Object.keys(storageResources).length === 0) {
            return undefined;
        }
        const [resourceName] = Object.keys(storageResources);
        return resourceName;
    }
    return undefined;
}
function getS3ResourcesFromAmplifyMeta(amplifyMeta) {
    if (!Object.prototype.hasOwnProperty.call(amplifyMeta, amplify_cli_core_1.AmplifyCategories.STORAGE)) {
        return undefined;
    }
    const resources = {};
    Object.keys(amplifyMeta[amplify_cli_core_1.AmplifyCategories.STORAGE]).forEach((resourceName) => {
        if (amplifyMeta[amplify_cli_core_1.AmplifyCategories.STORAGE][resourceName].service === amplify_cli_core_1.AmplifySupportedService.S3 &&
            amplifyMeta[amplify_cli_core_1.AmplifyCategories.STORAGE][resourceName].mobileHubMigrated !== true &&
            amplifyMeta[amplify_cli_core_1.AmplifyCategories.STORAGE][resourceName].serviceType !== 'imported') {
            resources[resourceName] = amplifyMeta[amplify_cli_core_1.AmplifyCategories.STORAGE][resourceName];
        }
    });
    return resources;
}
async function createNewLambdaAndUpdateCFN(context, triggerFunctionName, policyUUID) {
    const targetDir = context.amplify.pathManager.getBackendDirPath();
    const newShortUUID = policyUUID ? policyUUID : buildShortUUID();
    const newFunctionName = triggerFunctionName ? triggerFunctionName : `S3Trigger${newShortUUID}`;
    const pluginDir = __dirname;
    const defaults = {
        functionName: `${newFunctionName}`,
        roleName: `${newFunctionName}LambdaRole${newShortUUID}`,
    };
    const copyJobs = [
        {
            dir: pluginDir,
            template: path.join('..', '..', '..', '..', 'resources', 'triggers', 's3', 'lambda-cloudformation-template.json.ejs'),
            target: path.join(targetDir, 'function', newFunctionName, `${newFunctionName}-cloudformation-template.json`),
        },
        {
            dir: pluginDir,
            template: path.join('..', '..', '..', '..', 'resources', 'triggers', 's3', 'event.json'),
            target: path.join(targetDir, 'function', newFunctionName, 'src', 'event.json'),
        },
        {
            dir: pluginDir,
            template: path.join('..', '..', '..', '..', 'resources', 'triggers', 's3', 'index.js'),
            target: path.join(targetDir, 'function', newFunctionName, 'src', 'index.js'),
        },
        {
            dir: pluginDir,
            template: path.join('..', '..', '..', '..', 'resources', 'triggers', 's3', 'package.json.ejs'),
            target: path.join(targetDir, 'function', newFunctionName, 'src', 'package.json'),
        },
    ];
    await context.amplify.copyBatch(context, copyJobs, defaults);
    const backendConfigs = {
        service: amplify_cli_core_1.AmplifySupportedService.LAMBDA,
        providerPlugin: 'awscloudformation',
        build: true,
    };
    await context.amplify.updateamplifyMetaAfterResourceAdd('function', newFunctionName, backendConfigs);
    amplify_prompts_1.printer.success(`Successfully added resource ${newFunctionName} locally`);
    return newFunctionName;
}
exports.createNewLambdaAndUpdateCFN = createNewLambdaAndUpdateCFN;
async function getExistingFunctionsForTrigger(context, excludeFunctionName, isInteractive) {
    const excludeFunctionList = excludeFunctionName ? [excludeFunctionName] : [];
    const adminTriggerFunction = await (0, s3_resource_api_1.s3GetAdminTriggerFunctionName)(context);
    if (adminTriggerFunction && adminTriggerFunction != 'NONE') {
        excludeFunctionList.push(adminTriggerFunction);
    }
    let lambdaResourceNames = await getLambdaFunctionList(context);
    if (excludeFunctionList.length > 0 && lambdaResourceNames && lambdaResourceNames.length > 0) {
        lambdaResourceNames = lambdaResourceNames.filter((lambdaResourceName) => !excludeFunctionList.includes(lambdaResourceName));
    }
    if (lambdaResourceNames.length === 0 && isInteractive) {
        throw new Error("No functions were found in the project. Use 'amplify add function' to add a new function.");
    }
    return lambdaResourceNames;
}
var S3CLITriggerFlow;
(function (S3CLITriggerFlow) {
    S3CLITriggerFlow["ADD"] = "TRIGGER_ADD_FLOW";
    S3CLITriggerFlow["UPDATE"] = "TRIGGER_UPDATE_FLOW";
    S3CLITriggerFlow["REMOVE"] = "TRIGGER_REMOVE_FLOW";
})(S3CLITriggerFlow = exports.S3CLITriggerFlow || (exports.S3CLITriggerFlow = {}));
var S3CLITriggerStateEvent;
(function (S3CLITriggerStateEvent) {
    S3CLITriggerStateEvent["ADD_NEW_TRIGGER"] = "ADD_NEW_TRIGGER";
    S3CLITriggerStateEvent["REPLACE_TRIGGER"] = "REPLACE_TRIGGER";
    S3CLITriggerStateEvent["DELETE_TRIGGER"] = "DELETE_TRIGGER";
    S3CLITriggerStateEvent["ERROR"] = "TRIGGER_ERROR";
    S3CLITriggerStateEvent["NO_OP"] = "TRIGGER_NO_OP";
})(S3CLITriggerStateEvent = exports.S3CLITriggerStateEvent || (exports.S3CLITriggerStateEvent = {}));
function getCLITriggerStateEvent(triggerFlowType, existingTriggerFunction) {
    if (triggerFlowType === S3CLITriggerFlow.ADD) {
        if (existingTriggerFunction) {
            return S3CLITriggerStateEvent.ERROR;
        }
        else {
            return S3CLITriggerStateEvent.ADD_NEW_TRIGGER;
        }
    }
    else {
        if (triggerFlowType === S3CLITriggerFlow.UPDATE) {
            return S3CLITriggerStateEvent.REPLACE_TRIGGER;
        }
        else {
            if (existingTriggerFunction) {
                return S3CLITriggerStateEvent.DELETE_TRIGGER;
            }
            else {
                return S3CLITriggerStateEvent.NO_OP;
            }
        }
    }
}
async function interactiveCreateNewLambdaAndUpdateCFN(context) {
    const newTriggerFunction = await createNewLambdaAndUpdateCFN(context, undefined, undefined);
    await (0, s3_questions_1.askAndOpenFunctionEditor)(context, newTriggerFunction);
    return newTriggerFunction;
}
async function interactiveAddExistingLambdaAndUpdateCFN(context, existingTriggerFunction = undefined, existingLambdaResources = undefined) {
    const lambdaResources = existingLambdaResources
        ? existingLambdaResources
        : await getExistingFunctionsForTrigger(context, existingTriggerFunction, true);
    const selectedFunction = await (0, s3_questions_1.askSelectExistingFunctionToAddTrigger)(lambdaResources);
    return selectedFunction;
}
async function interactiveAskTriggerTypeFlow(context, _policyID, existingTriggerFunction, existingLambdaResources = undefined) {
    const triggerTypeAnswer = await (0, s3_questions_1.askTriggerFunctionTypeQuestion)();
    switch (triggerTypeAnswer) {
        case s3_user_input_types_1.S3TriggerFunctionType.EXISTING_FUNCTION: {
            const selectedFunction = await interactiveAddExistingLambdaAndUpdateCFN(context, existingTriggerFunction, existingLambdaResources);
            return selectedFunction;
        }
        case s3_user_input_types_1.S3TriggerFunctionType.NEW_FUNCTION: {
            const newTriggerFunction = await interactiveCreateNewLambdaAndUpdateCFN(context);
            return newTriggerFunction;
        }
    }
    return undefined;
}
async function getLambdaFunctionList(context) {
    var _a;
    const { allResources } = await context.amplify.getResourceStatus();
    const lambdaResources = allResources && allResources.length > 0
        ? (_a = allResources === null || allResources === void 0 ? void 0 : allResources.filter((resource) => resource.service === amplify_cli_core_1.AmplifySupportedService.LAMBDA)) === null || _a === void 0 ? void 0 : _a.map((resource) => resource.resourceName)
        : [];
    return lambdaResources ? lambdaResources : [];
}
const resourceAlreadyExists = () => {
    const amplifyMeta = amplify_cli_core_1.stateManager.getMeta();
    let resourceName;
    if (amplifyMeta[amplify_cli_core_1.AmplifyCategories.STORAGE]) {
        const categoryResources = amplifyMeta[amplify_cli_core_1.AmplifyCategories.STORAGE];
        Object.keys(categoryResources).forEach((resource) => {
            if (categoryResources[resource].service === amplify_cli_core_1.AmplifySupportedService.S3) {
                resourceName = resource;
            }
        });
    }
    return resourceName;
};
exports.resourceAlreadyExists = resourceAlreadyExists;
function checkIfAuthExists() {
    const amplifyMeta = amplify_cli_core_1.stateManager.getMeta();
    let authExists = false;
    const authServiceName = 'Cognito';
    const authCategory = 'auth';
    if (amplifyMeta[authCategory] && Object.keys(amplifyMeta[authCategory]).length > 0) {
        const categoryResources = amplifyMeta[authCategory];
        Object.keys(categoryResources).forEach((resource) => {
            if (categoryResources[resource].service === authServiceName) {
                authExists = true;
            }
        });
    }
    return authExists;
}
exports.checkIfAuthExists = checkIfAuthExists;
function getIAMPolicies(resourceName, crudOptions) {
    const policy = [];
    let actions = new Set();
    crudOptions.forEach((crudOption) => {
        switch (crudOption) {
            case 'create':
                actions.add('s3:PutObject');
                break;
            case 'update':
                actions.add('s3:PutObject');
                break;
            case 'read':
                actions.add('s3:GetObject');
                actions.add('s3:ListBucket');
                break;
            case 'delete':
                actions.add('s3:DeleteObject');
                break;
            default:
                amplify_prompts_1.printer.info(`${crudOption} not supported`);
        }
    });
    actions = Array.from(actions);
    if (actions.includes('s3:ListBucket')) {
        let listBucketPolicy = {};
        listBucketPolicy = {
            Effect: 'Allow',
            Action: 's3:ListBucket',
            Resource: [
                {
                    'Fn::Join': [
                        '',
                        [
                            'arn:aws:s3:::',
                            {
                                Ref: `${amplify_cli_core_1.AmplifyCategories.STORAGE}${resourceName}BucketName`,
                            },
                        ],
                    ],
                },
            ],
        };
        actions = actions.filter((action) => action != 's3:ListBucket');
        policy.push(listBucketPolicy);
    }
    const s3ObjectPolicy = {
        Effect: 'Allow',
        Action: actions,
        Resource: [
            {
                'Fn::Join': [
                    '',
                    [
                        'arn:aws:s3:::',
                        {
                            Ref: `${amplify_cli_core_1.AmplifyCategories.STORAGE}${resourceName}BucketName`,
                        },
                        '/*',
                    ],
                ],
            },
        ],
    };
    policy.push(s3ObjectPolicy);
    const attributes = ['BucketName'];
    return { policy, attributes };
}
exports.getIAMPolicies = getIAMPolicies;
//# sourceMappingURL=s3-walkthrough.js.map