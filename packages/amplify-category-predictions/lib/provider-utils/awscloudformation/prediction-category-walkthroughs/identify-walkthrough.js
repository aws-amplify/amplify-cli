"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const identifyCFNGenerate_1 = require("../assets/identifyCFNGenerate");
const identifyQuestions_1 = __importDefault(require("../assets/identifyQuestions"));
const regionMapping_1 = __importDefault(require("../assets/regionMapping"));
const identify_defaults_1 = __importDefault(require("../default-values/identify-defaults"));
const enable_guest_auth_1 = require("./enable-guest-auth");
const storage_api_1 = require("./storage-api");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const amplify_cli_core_2 = require("@aws-amplify/amplify-cli-core");
const path = require('path');
const fs = require('fs-extra');
const os = require('os');
const uuid = require('uuid');
const templateFilename = 'identify-template.json.ejs';
const identifyTypes = ['identifyText', 'identifyEntities', 'identifyLabels'];
let service = 'Rekognition';
const category = amplify_cli_core_1.AmplifyCategories.PREDICTIONS;
const storageCategory = amplify_cli_core_1.AmplifyCategories.STORAGE;
const functionCategory = amplify_cli_core_1.AmplifyCategories.FUNCTION;
const parametersFileName = 'parameters.json';
const s3defaultValuesFilename = 's3-defaults.js';
const prefixForAdminTrigger = 'protected/predictions/index-faces/';
const PREDICTIONS_WALKTHROUGH_MODE = {
    ADD: 'ADD',
    UPDATE: 'UPDATE',
};
async function addWalkthrough(context) {
    while (!checkIfAuthExists(context)) {
        if (await amplify_prompts_1.prompter.yesOrNo('You need to add auth (Amazon Cognito) to your project in order to add storage for user files. Do you want to add auth now?')) {
            await context.amplify.invokePluginMethod(context, 'auth', undefined, 'add', [context]);
            break;
        }
        else {
            context.usageData.emitSuccess();
            (0, amplify_cli_core_1.exitOnNextTick)(0);
        }
    }
    return await configure(context, undefined, PREDICTIONS_WALKTHROUGH_MODE.ADD);
}
async function updateWalkthrough(context) {
    const { amplify } = context;
    const { amplifyMeta } = amplify.getProjectDetails();
    const predictionsResources = [];
    Object.keys(amplifyMeta[category]).forEach((resourceName) => {
        if (identifyTypes.includes(amplifyMeta[category][resourceName].identifyType)) {
            predictionsResources.push({
                name: resourceName,
                value: { name: resourceName, identifyType: amplifyMeta[category][resourceName].identifyType },
            });
        }
    });
    if (predictionsResources.length === 0) {
        throw new amplify_cli_core_2.AmplifyError('ResourceDoesNotExistError', {
            message: 'No resources to update. You need to add a resource.',
        });
    }
    let resourceObj = predictionsResources[0].value;
    if (predictionsResources.length > 1) {
        resourceObj = await amplify_prompts_1.prompter.pick('Which identify resource would you like to update?', predictionsResources);
    }
    return await configure(context, resourceObj, PREDICTIONS_WALKTHROUGH_MODE.UPDATE);
}
async function createAndRegisterAdminLambdaS3Trigger(context, predictionsResourceName, s3ResourceName, configMode) {
    const predictionsResourceSavedName = configMode === PREDICTIONS_WALKTHROUGH_MODE.ADD ? undefined : predictionsResourceName;
    let predictionsTriggerFunctionName = await createNewFunction(context, predictionsResourceSavedName, s3ResourceName);
    const adminTriggerFunctionParams = {
        tag: 'adminTriggerFunction',
        category: 'predictions',
        permissions: ['CREATE_AND_UPDATE', 'READ', 'DELETE'],
        triggerFunction: predictionsTriggerFunctionName,
        triggerEvents: ['s3:ObjectCreated:*', 's3:ObjectRemoved:*'],
        triggerPrefix: [{ prefix: prefixForAdminTrigger, prefixTransform: 'NONE' }],
    };
    const s3UserInputs = await (0, storage_api_1.invokeS3RegisterAdminTrigger)(context, s3ResourceName, adminTriggerFunctionParams);
    return s3UserInputs;
}
async function configure(context, predictionsResourceObj, configMode) {
    const { amplify } = context;
    const defaultValues = (0, identify_defaults_1.default)(amplify.getProjectDetails());
    const projectBackendDirPath = amplify_cli_core_1.pathManager.getBackendDirPath();
    let identifyType;
    let parameters = {};
    if (predictionsResourceObj) {
        const predictionsResourceDirPath = path.join(projectBackendDirPath, category, predictionsResourceObj.name);
        const predictionsParametersFilePath = path.join(predictionsResourceDirPath, parametersFileName);
        try {
            parameters = amplify.readJsonFile(predictionsParametersFilePath);
        }
        catch (e) {
            parameters = {};
        }
        identifyType = predictionsResourceObj.identifyType;
        parameters.resourceName = predictionsResourceObj.name;
        Object.assign(defaultValues, parameters);
    }
    let answers = {};
    if (!parameters.resourceName) {
        answers.identifyType = await amplify_prompts_1.prompter.pick('What would you like to identify?', [
            {
                name: 'Identify Text',
                value: 'identifyText',
            },
            {
                name: 'Identify Entities',
                value: 'identifyEntities',
            },
            {
                name: 'Identify Labels',
                value: 'identifyLabels',
            },
        ]);
        const resourceType = resourceAlreadyExists(context, answers.identifyType);
        if (resourceType) {
            throw new amplify_cli_core_2.AmplifyError('ResourceAlreadyExistsError', {
                message: `${resourceType} has already been added to this project.`,
            });
        }
        answers.resourceName = await amplify_prompts_1.prompter.input('Provide a friendly name for your resource', {
            initial: `${answers.identifyType}${defaultValues.resourceName}`,
            validate: (0, amplify_prompts_1.alphanumeric)(),
        });
        identifyType = answers.identifyType;
        parameters.resourceName = answers.resourceName;
    }
    Object.assign(answers, await followUpQuestions(identifyType, parameters));
    delete answers.setup;
    Object.assign(defaultValues, answers);
    if (answers.access === 'authAndGuest') {
        await (0, enable_guest_auth_1.enableGuestAuth)(context, defaultValues.resourceName, true);
    }
    let s3Resource = {};
    let predictionsTriggerFunctionName;
    if (answers.adminTask) {
        const s3ResourceName = await (0, storage_api_1.invokeS3GetResourceName)(context);
        const predictionsResourceName = parameters.resourceName;
        if (s3ResourceName) {
            let s3UserInputs = await (0, storage_api_1.invokeS3GetUserInputs)(context, s3ResourceName);
            s3Resource.bucketName = s3UserInputs.bucketName;
            s3Resource.resourceName = s3UserInputs.resourceName;
            if (!s3UserInputs.adminTriggerFunction) {
                s3UserInputs = await createAndRegisterAdminLambdaS3Trigger(context, predictionsResourceName, s3Resource.resourceName, configMode);
                predictionsTriggerFunctionName = s3UserInputs.adminTriggerFunction.triggerFunction;
            }
            else {
                predictionsTriggerFunctionName = s3UserInputs.adminTriggerFunction.triggerFunction;
            }
        }
        else {
            s3Resource = await addS3ForIdentity(context, answers.access, undefined);
            const s3UserInputs = await createAndRegisterAdminLambdaS3Trigger(context, predictionsResourceName, s3Resource.resourceName, configMode);
            predictionsTriggerFunctionName = s3UserInputs.adminTriggerFunction.triggerFunction;
        }
        s3Resource.functionName = predictionsTriggerFunctionName;
        const functionResourceDirPath = path.join(projectBackendDirPath, functionCategory, predictionsTriggerFunctionName);
        const functionParametersFilePath = path.join(functionResourceDirPath, parametersFileName);
        let functionParameters;
        try {
            functionParameters = amplify.readJsonFile(functionParametersFilePath);
        }
        catch (e) {
            functionParameters = {};
        }
        functionParameters.resourceName = answers.resourceName || parameters.resourceName;
        const functionJsonString = JSON.stringify(functionParameters, null, 4);
        fs.writeFileSync(functionParametersFilePath, functionJsonString, 'utf8');
    }
    else if (parameters.resourceName) {
        const s3ResourceName = s3ResourceAlreadyExists();
        if (s3ResourceName) {
            let s3UserInputs = await (0, storage_api_1.invokeS3GetUserInputs)(context, s3ResourceName);
            if (s3UserInputs.adminLambdaTrigger &&
                s3UserInputs.adminLambdaTrigger.triggerFunction &&
                s3UserInputs.adminLambdaTrigger.triggerFunction !== 'NONE') {
                await (0, storage_api_1.invokeS3RemoveAdminLambdaTrigger)(context, s3ResourceName);
            }
        }
    }
    const { resourceName } = defaultValues;
    delete defaultValues.service;
    delete defaultValues.region;
    const resourceDirPath = path.join(projectBackendDirPath, category, resourceName);
    fs.ensureDirSync(resourceDirPath);
    const parametersFilePath = path.join(resourceDirPath, parametersFileName);
    const jsonString = JSON.stringify(defaultValues, null, 4);
    fs.writeFileSync(parametersFilePath, jsonString, 'utf8');
    const options = {};
    options.dependsOn = [];
    defaultValues.adminTask = answers.adminTask;
    if (answers.adminTask) {
        defaultValues.storageResourceName = s3Resource.resourceName;
        defaultValues.functionName = s3Resource.functionName;
        options.dependsOn.push({
            category: functionCategory,
            resourceName: predictionsTriggerFunctionName,
            attributes: ['Name', 'Arn', 'LambdaExecutionRole'],
        });
        options.dependsOn.push({
            category: storageCategory,
            resourceName: s3Resource.resourceName,
            attributes: ['BucketName'],
        });
        if (answers.folderPolicies === 'app' && parameters.resourceName && configMode != PREDICTIONS_WALKTHROUGH_MODE.ADD) {
            addStorageIAMResourcesToIdentifyCFNFile(parameters.resourceName, s3Resource.resourceName);
        }
    }
    Object.assign(defaultValues, options);
    const { dependsOn } = defaultValues;
    let amplifyMetaValues = {
        resourceName,
        service,
        dependsOn,
        identifyType,
    };
    if (configMode === PREDICTIONS_WALKTHROUGH_MODE.UPDATE) {
        updateCFN(context, resourceName, identifyType);
    }
    if (configMode === PREDICTIONS_WALKTHROUGH_MODE.ADD) {
        await copyCfnTemplate(context, category, resourceName, defaultValues);
    }
    addRegionMapping(context, resourceName, identifyType);
    return amplifyMetaValues;
}
function addRegionMapping(context, resourceName, identifyType) {
    const regionMapping = regionMapping_1.default.getRegionMapping(context, service, identifyType);
    const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();
    const identifyCFNFilePath = path.join(projectBackendDirPath, category, resourceName, `${resourceName}-template.json`);
    const identifyCFNFile = context.amplify.readJsonFile(identifyCFNFilePath);
    identifyCFNFile.Mappings = regionMapping;
    const identifyCFNJSON = JSON.stringify(identifyCFNFile, null, 4);
    fs.writeFileSync(identifyCFNFilePath, identifyCFNJSON, 'utf8');
}
function updateCFN(context, resourceName, identifyType) {
    if (identifyType === 'identifyText') {
        const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();
        const identifyCFNFilePath = path.join(projectBackendDirPath, category, resourceName, `${resourceName}-template.json`);
        const identifyCFNFile = context.amplify.readJsonFile(identifyCFNFilePath);
        let identifyCFNFileJSON;
        if (service === 'RekognitionAndTextract') {
            identifyCFNFileJSON = (0, identifyCFNGenerate_1.addTextractPolicies)(identifyCFNFile);
        }
        else {
            identifyCFNFileJSON = (0, identifyCFNGenerate_1.removeTextractPolicies)(identifyCFNFile);
        }
        fs.writeFileSync(identifyCFNFilePath, identifyCFNFileJSON, 'utf8');
        context.amplify.updateamplifyMetaAfterResourceUpdate(category, resourceName, 'service', service);
    }
}
async function copyCfnTemplate(context, categoryName, resourceName, options) {
    const { amplify } = context;
    const targetDir = amplify.pathManager.getBackendDirPath();
    const pluginDir = __dirname;
    const copyJobs = [
        {
            dir: pluginDir,
            template: `../cloudformation-templates/${templateFilename}`,
            target: `${targetDir}/${categoryName}/${resourceName}/${resourceName}-template.json`,
        },
    ];
    return await context.amplify.copyBatch(context, copyJobs, options);
}
async function followUpQuestions(identifyType, parameters) {
    switch (identifyType) {
        case 'identifyText': {
            return followUpIdentifyTextQuestions(parameters);
        }
        case 'identifyEntities': {
            return followUpIdentifyEntitiesQuestions(parameters);
        }
        case 'identifyLabels': {
            return followUpIdentifyLabelsQuestions(parameters);
        }
    }
}
async function followUpIdentifyTextQuestions(parameters) {
    var _a;
    const answers = {
        identifyDoc: await amplify_prompts_1.prompter.yesOrNo('Would you also like to identify documents?', (_a = parameters === null || parameters === void 0 ? void 0 : parameters.identifyDoc) !== null && _a !== void 0 ? _a : false),
        access: await askIdentifyAccess(parameters),
    };
    if (answers.identifyDoc) {
        service = 'RekognitionAndTextract';
    }
    Object.assign(answers, { format: answers.identifyDoc ? 'ALL' : 'PLAIN' });
}
async function askIdentifyAccess(parameters) {
    var _a;
    return await amplify_prompts_1.prompter.pick('Who should have access?', [
        {
            name: 'Auth users only',
            value: 'auth',
        },
        {
            name: 'Auth and Guest users',
            value: 'authAndGuest',
        },
    ], {
        initial: (0, amplify_prompts_1.byValue)((_a = parameters.access) !== null && _a !== void 0 ? _a : 'auth'),
    });
}
async function followUpIdentifyEntitiesQuestions(parameters) {
    var _a, _b, _c;
    const answers = {};
    answers.setup = await amplify_prompts_1.prompter.pick('Would you like to use the default configuration?', [
        {
            name: 'Default Configuration',
            value: 'default',
        },
        {
            name: 'Advanced Configuration',
            value: 'advanced',
        },
    ]);
    if (answers.setup === 'advanced') {
        answers.celebrityDetectionEnabled = await amplify_prompts_1.prompter.yesOrNo('Would you like to enable celebrity detection?', (_a = parameters === null || parameters === void 0 ? void 0 : parameters.celebrityDetectionEnabled) !== null && _a !== void 0 ? _a : true);
        answers.adminTask = await amplify_prompts_1.prompter.yesOrNo('Would you like to identify entities from a collection of images?', (_b = parameters === null || parameters === void 0 ? void 0 : parameters.adminTask) !== null && _b !== void 0 ? _b : false);
        if (answers.adminTask) {
            answers.maxEntities = await amplify_prompts_1.prompter.input('How many entities would you like to identify?', {
                initial: (_c = parameters === null || parameters === void 0 ? void 0 : parameters.maxEntities) !== null && _c !== void 0 ? _c : 50,
                validate: (0, amplify_prompts_1.between)(1, 100, 'Please enter a number between 1 and 100!'),
                transform: (input) => Number.parseInt(input, 10),
            });
            answers.folderPolicies = await amplify_prompts_1.prompter.pick('Would you like to allow users to add images to this collection?', [
                {
                    name: 'Yes',
                    value: 'app',
                },
                {
                    name: 'No',
                    value: 'admin',
                },
            ], {
                initial: parameters.folderPolicies ? (0, amplify_prompts_1.byValue)(parameters.folderPolicies) : 0,
            });
        }
    }
    answers.access = await askIdentifyAccess(parameters);
    if (answers.setup && answers.setup === 'default') {
        Object.assign(answers, { celebrityDetectionEnabled: true });
    }
    if (!answers.adminTask) {
        answers.maxEntities = 0;
        answers.adminTask = false;
        answers.folderPolicies = '';
    }
    if (answers.folderPolicies === 'app') {
        answers.adminAuthProtected = 'ALLOW';
        if (answers.access === 'authAndGuest') {
            answers.adminGuestProtected = 'ALLOW';
        }
    }
    return answers;
}
async function followUpIdentifyLabelsQuestions(parameters) {
    var _a;
    const answers = {
        setup: await amplify_prompts_1.prompter.pick('Would you like to use the default configuration', [
            {
                name: 'Default Configuration',
                value: 'default',
            },
            {
                name: 'Advanced Configuration',
                value: 'advanced',
            },
        ]),
    };
    if (answers.setup === 'advanced') {
        answers.type = await amplify_prompts_1.prompter.pick('What kind of label detection?', [
            {
                name: 'Only identify unsafe labels',
                value: 'UNSAFE',
            },
            {
                name: 'Identify labels',
                value: 'LABELS',
            },
            {
                name: 'Identify all kinds',
                value: 'ALL',
            },
        ], {
            initial: (0, amplify_prompts_1.byValue)((_a = parameters.type) !== null && _a !== void 0 ? _a : 'LABELS'),
        });
    }
    answers.access = await askIdentifyAccess(parameters);
    if (answers.setup === 'default') {
        Object.assign(answers, { type: 'LABELS' });
    }
}
function checkIfAuthExists(context) {
    const { amplify } = context;
    const { amplifyMeta } = amplify.getProjectDetails();
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
function resourceAlreadyExists(context, identifyType) {
    const { amplify } = context;
    const { amplifyMeta } = amplify.getProjectDetails();
    let type;
    if (amplifyMeta[category] && context.commandName !== 'update') {
        const categoryResources = amplifyMeta[category];
        Object.keys(categoryResources).forEach((resource) => {
            if (categoryResources[resource].identifyType === identifyType) {
                type = identifyType;
            }
        });
    }
    return type;
}
async function addS3ForIdentity(context, storageAccess, bucketName) {
    const defaultValuesSrc = `${__dirname}/../default-values/${s3defaultValuesFilename}`;
    const { getAllAuthDefaultPerm, getAllAuthAndGuestDefaultPerm } = require(defaultValuesSrc);
    let s3UserInputs = await (0, storage_api_1.invokeS3GetAllDefaults)(context, storageAccess);
    let answers = {};
    answers = { ...answers, storageAccess, resourceName: s3UserInputs.resourceName };
    if (!bucketName) {
        const question = {
            name: identifyQuestions_1.default.s3bucket.key,
            message: identifyQuestions_1.default.s3bucket.question,
            validate: (value) => {
                const regex = new RegExp('^[a-zA-Z0-9-]+$');
                return regex.test(value) ? true : 'Bucket name can only use the following characters: a-z 0-9 -';
            },
        };
        s3UserInputs.bucketName = await amplify_prompts_1.prompter.input(question.message, {
            validate: question.validate,
            initial: s3UserInputs.bucketName,
        });
    }
    else {
        s3UserInputs.bucketName = bucketName;
    }
    let allowUnauthenticatedIdentities;
    if (answers.storageAccess === 'authAndGuest') {
        s3UserInputs = getAllAuthAndGuestDefaultPerm(s3UserInputs);
        allowUnauthenticatedIdentities = true;
    }
    else {
        s3UserInputs = getAllAuthDefaultPerm(s3UserInputs);
    }
    const resultS3UserInput = await (0, storage_api_1.invokeS3AddResource)(context, s3UserInputs);
    const storageRequirements = { authSelections: 'identityPoolAndUserPool', allowUnauthenticatedIdentities };
    const checkResult = await context.amplify.invokePluginMethod(context, 'auth', undefined, 'checkRequirements', [
        storageRequirements,
        context,
        storageCategory,
        s3UserInputs.resourceName,
    ]);
    if (checkResult.authImported === true && checkResult.errors && checkResult.errors.length > 0) {
        throw new Error(checkResult.errors.join(os.EOL));
    }
    if (checkResult.errors && checkResult.errors.length > 0) {
        context.print.warning(checkResult.errors.join(os.EOL));
    }
    if (!checkResult.authEnabled || !checkResult.requirementsMet) {
        try {
            if (storageRequirements.allowUnauthenticatedIdentities === undefined) {
                storageRequirements.allowUnauthenticatedIdentities = false;
            }
            await context.amplify.invokePluginMethod(context, 'auth', undefined, 'externalAuthEnable', [
                context,
                storageCategory,
                s3UserInputs.resourceName,
                storageRequirements,
            ]);
        }
        catch (error) {
            context.print.error(error);
            throw error;
        }
    }
    return {
        bucketName: resultS3UserInput.bucketName,
        resourceName: resultS3UserInput.resourceName,
        functionName: resultS3UserInput.adminTriggerFunction ? resultS3UserInput.adminTriggerFunction.triggerFunction : undefined,
    };
}
function s3ResourceAlreadyExists() {
    const amplifyMeta = amplify_cli_core_1.stateManager.getMeta();
    let resourceName;
    if (amplifyMeta[storageCategory]) {
        const categoryResources = amplifyMeta[storageCategory];
        Object.keys(categoryResources).forEach((resource) => {
            if (categoryResources[resource].service === amplify_cli_core_1.AmplifySupportedService.S3) {
                resourceName = resource;
            }
        });
    }
    return resourceName;
}
async function postCFNGenUpdateLambdaResourceInPredictions(context, predictionsResourceName, functionName, s3ResourceName) {
    const projectBackendDirPath = amplify_cli_core_1.pathManager.getBackendDirPath();
    const identifyCFNFilePath = path.join(projectBackendDirPath, category, predictionsResourceName, `${predictionsResourceName}-template.json`);
    let identifyCFNFile;
    identifyCFNFile = amplify_cli_core_1.JSONUtilities.readJson(identifyCFNFilePath);
    identifyCFNFile = (0, identifyCFNGenerate_1.generateLambdaAccessForRekognition)(identifyCFNFile, functionName, s3ResourceName);
    amplify_cli_core_1.JSONUtilities.writeJson(identifyCFNFilePath, identifyCFNFile);
    const amplifyMeta = amplify_cli_core_1.stateManager.getMeta();
    const dependsOnResources = amplifyMeta.predictions[predictionsResourceName].dependsOn;
    dependsOnResources.push({
        category: functionCategory,
        resourceName: functionName,
        attributes: ['Name', 'Arn', 'LambdaExecutionRole'],
    });
    dependsOnResources.push({
        category: storageCategory,
        resourceName: s3ResourceName,
        attributes: ['BucketName'],
    });
    context.amplify.updateamplifyMetaAfterResourceUpdate(category, predictionsResourceName, 'dependsOn', dependsOnResources);
}
async function createNewFunction(context, predictionsResourceName, s3ResourceName) {
    const targetDir = amplify_cli_core_1.pathManager.getBackendDirPath();
    const [shortId] = uuid.v4().split('-');
    const functionName = `RekognitionIndexFacesTrigger${shortId}`;
    const pluginDir = __dirname;
    const defaults = {
        functionName: `${functionName}`,
        roleName: `${functionName}LambdaRole${shortId}`,
    };
    const copyJobs = [
        {
            dir: pluginDir,
            template: '../triggers/s3/lambda-cloudformation-template.json.ejs',
            target: `${targetDir}/function/${functionName}/${functionName}-cloudformation-template.json`,
        },
        {
            dir: pluginDir,
            template: '../triggers/s3/event.json',
            target: `${targetDir}/function/${functionName}/src/event.json`,
        },
        {
            dir: pluginDir,
            template: '../triggers/s3/index.js',
            target: `${targetDir}/function/${functionName}/src/index.js`,
        },
        {
            dir: pluginDir,
            template: '../triggers/s3/package.json.ejs',
            target: `${targetDir}/function/${functionName}/src/package.json`,
        },
    ];
    await context.amplify.copyBatch(context, copyJobs, defaults);
    if (predictionsResourceName) {
        await postCFNGenUpdateLambdaResourceInPredictions(context, predictionsResourceName, functionName, s3ResourceName);
    }
    const backendConfigs = {
        service: amplify_cli_core_1.AmplifySupportedService.LAMBDA,
        providerPlugin: 'awscloudformation',
        build: true,
    };
    await context.amplify.updateamplifyMetaAfterResourceAdd(functionCategory, functionName, backendConfigs);
    context.print.success(`Successfully added resource ${functionName} locally`);
    return functionName;
}
function addStorageIAMResourcesToIdentifyCFNFile(predictionsResourceName, s3ResourceName) {
    const projectBackendDirPath = amplify_cli_core_1.pathManager.getBackendDirPath();
    const identifyCFNFilePath = path.join(projectBackendDirPath, category, predictionsResourceName, `${predictionsResourceName}-template.json`);
    let identifyCFNFile = amplify_cli_core_1.JSONUtilities.readJson(identifyCFNFilePath);
    identifyCFNFile = (0, identifyCFNGenerate_1.generateStorageAccessForRekognition)(identifyCFNFile, s3ResourceName, prefixForAdminTrigger);
    const identifyCFNString = JSON.stringify(identifyCFNFile, null, 4);
    fs.writeFileSync(identifyCFNFilePath, identifyCFNString, 'utf8');
}
module.exports = { addWalkthrough, updateWalkthrough };
//# sourceMappingURL=identify-walkthrough.js.map