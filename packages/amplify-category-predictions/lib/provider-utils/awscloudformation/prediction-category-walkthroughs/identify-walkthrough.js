"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const identifyQuestions_1 = __importDefault(require("../assets/identifyQuestions"));
const identify_defaults_1 = __importDefault(require("../default-values/identify-defaults"));
const regionMapping_1 = __importDefault(require("../assets/regionMapping"));
const enable_guest_auth_1 = require("./enable-guest-auth");
const amplify_cli_core_1 = require("amplify-cli-core");
const inquirer_1 = __importDefault(require("inquirer"));
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const os_1 = __importDefault(require("os"));
const uuid_1 = __importDefault(require("uuid"));
const FunctionServiceNameLambdaFunction = 'Lambda';
const templateFilename = 'identify-template.json.ejs';
const identifyTypes = ['identifyText', 'identifyEntities', 'identifyLabels'];
let service = 'Rekognition';
const category = 'predictions';
const storageCategory = 'storage';
const functionCategory = 'function';
const parametersFileName = 'parameters.json';
const amplifyMetaFilename = 'amplify-meta.json';
const s3defaultValuesFilename = 's3-defaults.js';
const s3TemplateFileName = 's3-cloudformation-template.json.ejs';
const s3CloudFormationTemplateFile = 's3-cloudformation-template.json';
const s3ServiceName = 'S3';
const prefixForAdminTrigger = 'protected/predictions/index-faces/';
async function addWalkthrough(context) {
    while (!checkIfAuthExists(context)) {
        if (await context.amplify.confirmPrompt('You need to add auth (Amazon Cognito) to your project in order to add storage for user files. Do you want to add auth now?')) {
            await context.amplify.invokePluginMethod(context, 'auth', undefined, 'add', [context]);
            break;
        }
        else {
            context.usageData.emitSuccess();
            amplify_cli_core_1.exitOnNextTick(0);
        }
    }
    return await configure(context, undefined);
}
async function updateWalkthrough(context) {
    const { amplify } = context;
    const { amplifyMeta } = amplify.getProjectDetails();
    const predictionsResources = [];
    Object.keys(amplifyMeta[category]).forEach(resourceName => {
        if (identifyTypes.includes(amplifyMeta[category][resourceName].identifyType)) {
            predictionsResources.push({
                name: resourceName,
                value: { name: resourceName, identifyType: amplifyMeta[category][resourceName].identifyType },
            });
        }
    });
    if (predictionsResources.length === 0) {
        const errMessage = 'No resources to update. You need to add a resource.';
        context.print.error(errMessage);
        context.usageData.emitError(new amplify_cli_core_1.ResourceDoesNotExistError(errMessage));
        amplify_cli_core_1.exitOnNextTick(0);
    }
    let resourceObj = predictionsResources[0].value;
    if (predictionsResources.length > 1) {
        const resourceAnswer = await inquirer_1.default.prompt({
            type: 'list',
            name: 'resource',
            message: 'Which identify resource would you like to update?',
            choices: predictionsResources,
        });
        resourceObj = resourceAnswer.resource;
    }
    return await configure(context, resourceObj);
}
async function configure(context, resourceObj) {
    const { amplify } = context;
    const defaultValues = identify_defaults_1.default(amplify.getProjectDetails());
    const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();
    let identifyType;
    let parameters = {};
    if (resourceObj) {
        const resourceDirPath = path_1.default.join(projectBackendDirPath, category, resourceObj.name);
        const parametersFilePath = path_1.default.join(resourceDirPath, parametersFileName);
        try {
            parameters = amplify.readJsonFile(parametersFilePath);
        }
        catch (e) {
            parameters = {};
        }
        identifyType = resourceObj.identifyType;
        parameters.resourceName = resourceObj.name;
        Object.assign(defaultValues, parameters);
    }
    let answers = {};
    if (!parameters.resourceName) {
        answers = await inquirer_1.default.prompt(identifyQuestions_1.default.setup.type());
        const resourceType = resourceAlreadyExists(context, answers.identifyType);
        if (resourceType) {
            const errMessage = `${resourceType} has already been added to this project.`;
            context.print.warning(errMessage);
            context.usageData.emitError(new amplify_cli_core_1.ResourceAlreadyExistsError(errMessage));
            amplify_cli_core_1.exitOnNextTick(0);
        }
        Object.assign(answers, await inquirer_1.default.prompt(identifyQuestions_1.default.setup.name(`${answers.identifyType}${defaultValues.resourceName}`)));
        identifyType = answers.identifyType;
    }
    Object.assign(answers, await followUpQuestions(identifyQuestions_1.default[identifyType], identifyType, parameters));
    delete answers.setup;
    Object.assign(defaultValues, answers);
    if (answers.access === 'authAndGuest') {
        await enable_guest_auth_1.enableGuestAuth(context, defaultValues.resourceName, true);
    }
    let s3Resource = {};
    let functionName;
    if (answers.adminTask) {
        const s3ResourceName = s3ResourceAlreadyExists(context);
        console.log("SACPCDEBUG: [PREDICTIONS] s3ResourceName : ", s3ResourceName);
        if (s3ResourceName) {
            const resourceDirPath = path_1.default.join(projectBackendDirPath, storageCategory, s3ResourceName);
            const parametersFilePath = path_1.default.join(resourceDirPath, parametersFileName);
            const bucketParameters = amplify.readJsonFile(parametersFilePath);
            s3Resource.bucketName = bucketParameters.bucketName;
            s3Resource.resourceName = s3ResourceName;
            if (!bucketParameters.adminTriggerFunction) {
                if (!bucketParameters.triggerFunction || bucketParameters.triggerFunction === 'NONE') {
                    functionName = await addTrigger(context, s3Resource, undefined, parameters.resourceName);
                    bucketParameters.adminTriggerFunction = functionName;
                }
                else {
                    functionName = await addAdditionalLambdaTrigger(context, s3Resource, parameters.resourceName);
                    bucketParameters.adminTriggerFunction = functionName;
                }
            }
            else {
                functionName = bucketParameters.adminTriggerFunction;
            }
            s3Resource.functionName = functionName;
            if (Object.entries(bucketParameters).length !== 0 && bucketParameters.constructor === Object) {
                const jsonString = JSON.stringify(bucketParameters, null, 4);
                fs_extra_1.default.writeFileSync(parametersFilePath, jsonString, 'utf8');
            }
        }
        else {
            s3Resource = await addS3ForIdentity(context, answers.access, undefined, parameters.resourceName);
            functionName = s3Resource.functionName;
        }
        const functionresourceDirPath = path_1.default.join(projectBackendDirPath, functionCategory, functionName);
        const functionparametersFilePath = path_1.default.join(functionresourceDirPath, parametersFileName);
        let functionParameters;
        try {
            functionParameters = amplify.readJsonFile(functionparametersFilePath);
        }
        catch (e) {
            functionParameters = {};
        }
        functionParameters.resourceName = answers.resourceName || parameters.resourceName;
        const functionjsonString = JSON.stringify(functionParameters, null, 4);
        fs_extra_1.default.writeFileSync(functionparametersFilePath, functionjsonString, 'utf8');
    }
    else if (parameters.resourceName) {
        const s3ResourceName = s3ResourceAlreadyExists(context);
        if (s3ResourceName) {
            removeAdminLambdaTrigger(context, parameters.resourceName, s3ResourceName);
        }
    }
    const { resourceName } = defaultValues;
    delete defaultValues.service;
    delete defaultValues.region;
    const resourceDirPath = path_1.default.join(projectBackendDirPath, category, resourceName);
    fs_extra_1.default.ensureDirSync(resourceDirPath);
    const parametersFilePath = path_1.default.join(resourceDirPath, parametersFileName);
    const jsonString = JSON.stringify(defaultValues, null, 4);
    fs_extra_1.default.writeFileSync(parametersFilePath, jsonString, 'utf8');
    const options = {};
    options.dependsOn = [];
    defaultValues.adminTask = answers.adminTask;
    if (answers.adminTask) {
        defaultValues.storageResourceName = s3Resource.resourceName;
        defaultValues.functionName = s3Resource.functionName;
        options.dependsOn.push({
            category: functionCategory,
            resourceName: functionName,
            attributes: ['Name', 'Arn', 'LambdaExecutionRole'],
        });
        options.dependsOn.push({
            category: storageCategory,
            resourceName: s3Resource.resourceName,
            attributes: ['BucketName'],
        });
        if (answers.folderPolicies === 'app' && parameters.resourceName) {
            addStorageIAMResourcestoIdentifyCFNFile(context, parameters.resourceName, s3Resource.resourceName);
        }
    }
    Object.assign(defaultValues, options);
    const { dependsOn } = defaultValues;
    const amplifyMetaValues = {
        resourceName,
        service,
        dependsOn,
        identifyType,
    };
    if (parameters.resourceName) {
        updateCFN(context, resourceName, identifyType);
    }
    if (!parameters.resourceName) {
        await copyCfnTemplate(context, category, resourceName, defaultValues);
    }
    addRegionMapping(context, resourceName, identifyType);
    return amplifyMetaValues;
}
function addRegionMapping(context, resourceName, identifyType) {
    const regionMapping = regionMapping_1.default.getRegionMapping(context, service, identifyType);
    const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();
    const identifyCFNFilePath = path_1.default.join(projectBackendDirPath, category, resourceName, `${resourceName}-template.json`);
    const identifyCFNFile = context.amplify.readJsonFile(identifyCFNFilePath);
    identifyCFNFile.Mappings = regionMapping;
    const identifyCFNJSON = JSON.stringify(identifyCFNFile, null, 4);
    fs_extra_1.default.writeFileSync(identifyCFNFilePath, identifyCFNJSON, 'utf8');
}
function updateCFN(context, resourceName, identifyType) {
    if (identifyType === 'identifyText') {
        const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();
        const identifyCFNFilePath = path_1.default.join(projectBackendDirPath, category, resourceName, `${resourceName}-template.json`);
        const identifyCFNFile = context.amplify.readJsonFile(identifyCFNFilePath);
        let identifyCFNFileJSON;
        if (service === 'RekognitionAndTextract') {
            identifyCFNFileJSON = addTextractPolicies(identifyCFNFile);
        }
        else {
            identifyCFNFileJSON = removeTextractPolicies(identifyCFNFile);
        }
        fs_extra_1.default.writeFileSync(identifyCFNFilePath, identifyCFNFileJSON, 'utf8');
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
async function followUpQuestions(typeObj, identifyType, parameters) {
    const answers = await inquirer_1.default.prompt(typeObj.questions(parameters));
    Object.assign(answers, await inquirer_1.default.prompt(typeObj.auth(parameters)));
    if (answers.setup && answers.setup === 'default') {
        Object.assign(answers, typeObj.defaults);
    }
    if (identifyType === 'identifyText') {
        if (answers.identifyDoc) {
            service = 'RekognitionAndTextract';
        }
        Object.assign(answers, typeObj.formatFlag(answers.identifyDoc));
    }
    if (identifyType === 'identifyEntities') {
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
    }
    return answers;
}
function checkIfAuthExists(context) {
    const { amplify } = context;
    const { amplifyMeta } = amplify.getProjectDetails();
    let authExists = false;
    const authServiceName = 'Cognito';
    const authCategory = 'auth';
    if (amplifyMeta[authCategory] && Object.keys(amplifyMeta[authCategory]).length > 0) {
        const categoryResources = amplifyMeta[authCategory];
        Object.keys(categoryResources).forEach(resource => {
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
        Object.keys(categoryResources).forEach(resource => {
            if (categoryResources[resource].identifyType === identifyType) {
                type = identifyType;
            }
        });
    }
    return type;
}
async function addS3ForIdentity(context, storageAccess, bucketName, predictionsResourceName) {
    const defaultValuesSrc = `${__dirname}/../default-values/${s3defaultValuesFilename}`;
    const { getAllS3Defaults, getAllAuthDefaults, getAllAuthAndGuestDefaults } = require(defaultValuesSrc);
    const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();
    const defaultValues = getAllS3Defaults(context.amplify.getProjectDetails());
    const options = {
        providerPlugin: 'awscloudformation',
        service: s3ServiceName,
    };
    let answers = {};
    answers = { ...answers, storageAccess, resourceName: defaultValues.resourceName };
    if (!bucketName) {
        const question = {
            name: identifyQuestions_1.default.s3bucket.key,
            message: identifyQuestions_1.default.s3bucket.question,
            validate: (value) => {
                const regex = new RegExp('^[a-zA-Z0-9-]+$');
                return regex.test(value) ? true : 'Bucket name can only use the following characters: a-z 0-9 -';
            },
            default: () => {
                const defaultValue = defaultValues.bucketName;
                return defaultValue;
            },
        };
        const answers1 = await inquirer_1.default.prompt(question);
        answers = { ...answers, bucketName: answers1.bucketName };
    }
    else {
        answers = { ...answers, bucketName };
    }
    let allowUnauthenticatedIdentities;
    if (answers.storageAccess === 'authAndGuest') {
        Object.assign(answers, getAllAuthAndGuestDefaults());
        allowUnauthenticatedIdentities = true;
    }
    else {
        Object.assign(answers, getAllAuthDefaults());
    }
    const s3Resource = {
        resourceName: answers.resourceName,
    };
    answers.adminTriggerFunction = await addTrigger(context, s3Resource, options, predictionsResourceName);
    answers.triggerFunction = 'NONE';
    const storageRequirements = { authSelections: 'identityPoolAndUserPool', allowUnauthenticatedIdentities };
    const checkResult = await context.amplify.invokePluginMethod(context, 'auth', undefined, 'checkRequirements', [
        storageRequirements,
        context,
        storageCategory,
        answers.resourceName,
    ]);
    if (checkResult.authImported === true && checkResult.errors && checkResult.errors.length > 0) {
        throw new Error(checkResult.errors.join(os_1.default.EOL));
    }
    if (checkResult.errors && checkResult.errors.length > 0) {
        context.print.warning(checkResult.errors.join(os_1.default.EOL));
    }
    if (!checkResult.authEnabled || !checkResult.requirementsMet) {
        try {
            if (storageRequirements.allowUnauthenticatedIdentities === undefined) {
                storageRequirements.allowUnauthenticatedIdentities = false;
            }
            await context.amplify.invokePluginMethod(context, 'auth', undefined, 'externalAuthEnable', [
                context,
                storageCategory,
                answers.resourceName,
                storageRequirements,
            ]);
        }
        catch (error) {
            context.print.error(error);
            throw error;
        }
    }
    Object.assign(defaultValues, answers);
    const resource = defaultValues.resourceName;
    const resourceDirPath = path_1.default.join(projectBackendDirPath, storageCategory, resource);
    delete defaultValues.resourceName;
    delete defaultValues.storageAccess;
    fs_extra_1.default.ensureDirSync(resourceDirPath);
    const parametersFilePath = path_1.default.join(resourceDirPath, parametersFileName);
    const jsonString = JSON.stringify(defaultValues, null, 4);
    fs_extra_1.default.writeFileSync(parametersFilePath, jsonString, 'utf8');
    if (!bucketName) {
        if (options) {
            Object.assign(defaultValues, options);
        }
        await s3CopyCfnTemplate(context, storageCategory, resource, defaultValues);
        context.amplify.updateamplifyMetaAfterResourceAdd(storageCategory, resource, options);
        const { print } = context;
        print.success('Successfully added storage resource locally');
    }
    return {
        bucketName: answers.bucketName,
        resourceName: resource,
        functionName: answers.adminTriggerFunction,
    };
}
async function s3CopyCfnTemplate(context, categoryName, resourceName, options) {
    const { amplify } = context;
    const targetDir = amplify.pathManager.getBackendDirPath();
    const pluginDir = __dirname;
    const copyJobs = [
        {
            dir: pluginDir,
            template: `../cloudformation-templates/${s3TemplateFileName}`,
            target: `${targetDir}/${categoryName}/${resourceName}/s3-cloudformation-template.json`,
        },
    ];
    return await context.amplify.copyBatch(context, copyJobs, options);
}
async function addTrigger(context, s3Resource, options, predictionsResourceName) {
    const functionName = await createNewFunction(context, predictionsResourceName, s3Resource.resourceName);
    if (s3Resource.bucketName) {
        const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();
        const storageCFNFilePath = path_1.default.join(projectBackendDirPath, storageCategory, s3Resource.resourceName, s3CloudFormationTemplateFile);
        let storageCFNFile = context.amplify.readJsonFile(storageCFNFilePath);
        storageCFNFile = generateStorageCFNForLambda(storageCFNFile, functionName, prefixForAdminTrigger);
        const storageCFNString = JSON.stringify(storageCFNFile, null, 4);
        fs_extra_1.default.writeFileSync(storageCFNFilePath, storageCFNString, 'utf8');
        context.amplify.updateamplifyMetaAfterResourceUpdate(storageCategory, s3Resource.resourceName, 'dependsOn', [
            {
                category: functionCategory,
                resourceName: functionName,
                attributes: ['Name', 'Arn', 'LambdaExecutionRole'],
            },
        ]);
    }
    else {
        options.dependsOn = [];
        options.dependsOn.push({
            category: functionCategory,
            resourceName: functionName,
            attributes: ['Name', 'Arn', 'LambdaExecutionRole'],
        });
    }
    return functionName;
}
async function addAdditionalLambdaTrigger(context, s3Resource, predictionsResourceName) {
    const functionName = await createNewFunction(context, predictionsResourceName, s3Resource.resourceName);
    const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();
    const storageCFNFilePath = path_1.default.join(projectBackendDirPath, storageCategory, s3Resource.resourceName, s3CloudFormationTemplateFile);
    let storageCFNFile = context.amplify.readJsonFile(storageCFNFilePath);
    const amplifyMetaFilePath = path_1.default.join(projectBackendDirPath, amplifyMetaFilename);
    const amplifyMetaFile = context.amplify.readJsonFile(amplifyMetaFilePath);
    storageCFNFile = generateStorageCFNForAdditionalLambda(storageCFNFile, functionName, prefixForAdminTrigger);
    const storageCFNString = JSON.stringify(storageCFNFile, null, 4);
    fs_extra_1.default.writeFileSync(storageCFNFilePath, storageCFNString, 'utf8');
    const dependsOnResources = amplifyMetaFile.storage[s3Resource.resourceName].dependsOn;
    dependsOnResources.push({
        category: functionCategory,
        resourceName: functionName,
        attributes: ['Name', 'Arn', 'LambdaExecutionRole'],
    });
    context.amplify.updateamplifyMetaAfterResourceUpdate(storageCategory, s3Resource.resourceName, 'dependsOn', dependsOnResources);
    return functionName;
}
function s3ResourceAlreadyExists(context) {
    const { amplify } = context;
    const { amplifyMeta } = amplify.getProjectDetails();
    let resourceName;
    if (amplifyMeta[storageCategory]) {
        const categoryResources = amplifyMeta[storageCategory];
        Object.keys(categoryResources).forEach(resource => {
            if (categoryResources[resource].service === s3ServiceName) {
                resourceName = resource;
            }
        });
    }
    return resourceName;
}
async function createNewFunction(context, predictionsResourceName, s3ResourceName) {
    const targetDir = context.amplify.pathManager.getBackendDirPath();
    const [shortId] = uuid_1.default().split('-');
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
        const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();
        const identifyCFNFilePath = path_1.default.join(projectBackendDirPath, category, predictionsResourceName, `${predictionsResourceName}-template.json`);
        let identifyCFNFile = context.amplify.readJsonFile(identifyCFNFilePath);
        identifyCFNFile = generateLambdaAccessForRekognition(identifyCFNFile, functionName, s3ResourceName);
        const identifyCFNString = JSON.stringify(identifyCFNFile, null, 4);
        fs_extra_1.default.writeFileSync(identifyCFNFilePath, identifyCFNString, 'utf8');
        const amplifyMetaFilePath = path_1.default.join(projectBackendDirPath, amplifyMetaFilename);
        const amplifyMetaFile = context.amplify.readJsonFile(amplifyMetaFilePath);
        const dependsOnResources = amplifyMetaFile.predictions[predictionsResourceName].dependsOn;
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
    const backendConfigs = {
        service: FunctionServiceNameLambdaFunction,
        providerPlugin: 'awscloudformation',
        build: true,
    };
    await context.amplify.updateamplifyMetaAfterResourceAdd(functionCategory, functionName, backendConfigs);
    context.print.success(`Successfully added resource ${functionName} locally`);
    return functionName;
}
function addStorageIAMResourcestoIdentifyCFNFile(context, predictionsResourceName, s3ResourceName) {
    const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();
    const identifyCFNFilePath = path_1.default.join(projectBackendDirPath, category, predictionsResourceName, `${predictionsResourceName}-template.json`);
    let identifyCFNFile = context.amplify.readJsonFile(identifyCFNFilePath);
    identifyCFNFile = generateStorageAccessForRekognition(identifyCFNFile, s3ResourceName, prefixForAdminTrigger);
    const identifyCFNString = JSON.stringify(identifyCFNFile, null, 4);
    fs_extra_1.default.writeFileSync(identifyCFNFilePath, identifyCFNString, 'utf8');
}
function removeAdminLambdaTrigger(context, resourceName, s3ResourceName) {
    const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();
    const resourceDirPath = path_1.default.join(projectBackendDirPath, storageCategory, s3ResourceName);
    const parametersFilePath = path_1.default.join(resourceDirPath, parametersFileName);
    const bucketParameters = context.amplify.readJsonFile(parametersFilePath);
    const adminTriggerFunction = bucketParameters.adminTriggerFunction;
    if (adminTriggerFunction) {
        delete bucketParameters.adminTriggerFunction;
        const identifyCFNFilePath = path_1.default.join(projectBackendDirPath, category, resourceName, `${resourceName}-template.json`);
        const identifyCFNFile = context.amplify.readJsonFile(identifyCFNFilePath);
        delete identifyCFNFile.Parameters[`function${adminTriggerFunction}Arn`];
        delete identifyCFNFile.Parameters[`function${adminTriggerFunction}Name`];
        delete identifyCFNFile.Parameters[`function${adminTriggerFunction}LambdaExecutionRole`];
        delete identifyCFNFile.Parameters[`storage${s3ResourceName}BucketName`];
        delete identifyCFNFile.Resources.LambdaRekognitionAccessPolicy;
        delete identifyCFNFile.Outputs.collectionId;
        delete identifyCFNFile.Resources.CollectionCreationFunction;
        delete identifyCFNFile.Resources.CollectionFunctionOutputs;
        delete identifyCFNFile.Resources.CollectionsLambdaExecutionRole;
        delete identifyCFNFile.Resources.S3AuthPredicitionsAdminProtectedPolicy;
        delete identifyCFNFile.Resources.S3GuestPredicitionsAdminPublicPolicy;
        delete identifyCFNFile.Resources.IdentifyEntitiesSearchFacesPolicy;
        const storageCFNFilePath = path_1.default.join(projectBackendDirPath, storageCategory, s3ResourceName, s3CloudFormationTemplateFile);
        let storageCFNFile = context.amplify.readJsonFile(storageCFNFilePath);
        storageCFNFile = removeS3AdminLambdaTrigger(storageCFNFile, adminTriggerFunction);
        const amplifyMetaFilePath = path_1.default.join(projectBackendDirPath, amplifyMetaFilename);
        const amplifyMetaFile = context.amplify.readJsonFile(amplifyMetaFilePath);
        const s3DependsOnResources = amplifyMetaFile.storage[s3ResourceName].dependsOn;
        const s3Resources = [];
        s3DependsOnResources.forEach((resource) => {
            if (resource.resourceName !== adminTriggerFunction) {
                s3Resources.push(resource);
            }
        });
        const jsonString = JSON.stringify(bucketParameters, null, 4);
        fs_extra_1.default.writeFileSync(parametersFilePath, jsonString, 'utf8');
        const storageCFNString = JSON.stringify(storageCFNFile, null, 4);
        fs_extra_1.default.writeFileSync(storageCFNFilePath, storageCFNString, 'utf8');
        const identifyCFNString = JSON.stringify(identifyCFNFile, null, 4);
        fs_extra_1.default.writeFileSync(identifyCFNFilePath, identifyCFNString, 'utf8');
        context.amplify.updateamplifyMetaAfterResourceUpdate(category, resourceName, 'dependsOn', []);
        context.amplify.updateamplifyMetaAfterResourceUpdate(storageCategory, s3ResourceName, 'dependsOn', s3Resources);
    }
}
function removeS3AdminLambdaTrigger(storageCFNFile, adminTriggerFunction) {
    let modifyOnlyFilters = false;
    const lambdaConfigurations = [];
    storageCFNFile.Resources.S3Bucket.Properties.NotificationConfiguration.LambdaConfigurations.forEach((triggers) => {
        if (!(triggers.Filter &&
            typeof triggers.Filter.S3Key.Rules[0].Value === 'string' &&
            triggers.Filter.S3Key.Rules[0].Value.includes('index-faces'))) {
            modifyOnlyFilters = true;
            lambdaConfigurations.push(triggers);
        }
    });
    storageCFNFile.Resources.S3Bucket.Properties.NotificationConfiguration.LambdaConfigurations = lambdaConfigurations;
    delete storageCFNFile.Resources.AdminTriggerPermissions;
    delete storageCFNFile.Parameters.adminTriggerFunction;
    delete storageCFNFile.Parameters[`function${adminTriggerFunction}Arn`];
    delete storageCFNFile.Parameters[`function${adminTriggerFunction}Name`];
    delete storageCFNFile.Parameters[`function${adminTriggerFunction}LambdaExecutionRole`];
    const index = storageCFNFile.Resources.S3Bucket.DependsOn.indexOf('AdminTriggerPermissions');
    if (index > -1) {
        storageCFNFile.Resources.S3Bucket.DependsOn.splice(index, 1);
    }
    const roles = [];
    storageCFNFile.Resources.S3TriggerBucketPolicy.Properties.Roles.forEach((role) => {
        if (!role.Ref.includes(adminTriggerFunction)) {
            roles.push(role);
        }
    });
    storageCFNFile.Resources.S3TriggerBucketPolicy.Properties.Roles = roles;
    if (!modifyOnlyFilters) {
        delete storageCFNFile.Resources.S3Bucket.Properties.NotificationConfiguration;
        delete storageCFNFile.Resources.S3TriggerBucketPolicy;
        delete storageCFNFile.Resources.S3Bucket.DependsOn;
    }
    return storageCFNFile;
}
module.exports = { addWalkthrough, updateWalkthrough, removeS3AdminLambdaTrigger };
//# sourceMappingURL=identify-walkthrough.js.map