"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const inferQuestions_1 = __importDefault(require("../assets/inferQuestions"));
const infer_defaults_1 = __importDefault(require("../default-values/infer-defaults"));
const regionMapping_1 = __importDefault(require("../assets/regionMapping"));
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const path = require('path');
const fs = require('fs-extra');
const enable_guest_auth_1 = require("./enable-guest-auth");
const category = 'predictions';
const parametersFileName = 'parameters.json';
const templateFilename = 'infer-template.json.ejs';
const inferTypes = ['inferModel'];
const service = 'SageMaker';
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
    return await configure(context);
}
async function updateWalkthrough(context) {
    const { amplify } = context;
    const { amplifyMeta } = amplify.getProjectDetails();
    const predictionsResources = [];
    Object.keys(amplifyMeta[category]).forEach((resourceName) => {
        if (inferTypes.includes(amplifyMeta[category][resourceName].inferType)) {
            predictionsResources.push({
                name: resourceName,
                value: { name: resourceName, inferType: amplifyMeta[category][resourceName].inferType },
            });
        }
    });
    if (predictionsResources.length === 0) {
        const errMessage = 'No resources to update. You need to add a resource.';
        context.print.error(errMessage);
        context.usageData.emitError(new amplify_cli_core_1.ResourceDoesNotExistError(errMessage));
        (0, amplify_cli_core_1.exitOnNextTick)(0);
        return undefined;
    }
    let resourceObj = predictionsResources[0].value;
    if (predictionsResources.length > 1) {
        resourceObj = await amplify_prompts_1.prompter.pick('Which infer resource would you like to update?', predictionsResources);
    }
    return configure(context, resourceObj);
}
async function configure(context, resourceObj) {
    const { amplify } = context;
    const defaultValues = (0, infer_defaults_1.default)(amplify.getProjectDetails());
    const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();
    let parameters = {};
    let inferType;
    if (resourceObj) {
        const resourceDirPath = path.join(projectBackendDirPath, category, resourceObj.name);
        const parametersFilePath = path.join(resourceDirPath, parametersFileName);
        try {
            parameters = amplify.readJsonFile(parametersFilePath);
        }
        catch (e) {
            parameters = {};
        }
        inferType = resourceObj.inferType;
        parameters.resourceName = resourceObj.name;
        Object.assign(defaultValues, parameters);
    }
    let answers = {};
    if (!parameters.resourceName) {
        const inferAssetsTypeInput = inferQuestions_1.default.setup.type();
        answers[inferAssetsTypeInput.name] = await amplify_prompts_1.prompter.pick(inferAssetsTypeInput.message, inferAssetsTypeInput.choices);
        const resourceType = resourceAlreadyExists(context, answers.inferType);
        if (resourceType) {
            const errMessage = `${resourceType} has already been added to this project.`;
            context.print.warning(errMessage);
            context.usageData.emitError(new amplify_cli_core_1.ResourceAlreadyExistsError(errMessage));
            (0, amplify_cli_core_1.exitOnNextTick)(0);
        }
        const inferAssetsNameInput = inferQuestions_1.default.setup.name(`${answers.inferType}${defaultValues.resourceName}`);
        Object.assign(answers, {
            [inferAssetsNameInput.name]: await amplify_prompts_1.prompter.input(inferAssetsNameInput.message, {
                validate: inferAssetsNameInput.validate,
                initial: inferAssetsNameInput.default,
            }),
        });
        inferType = answers.inferType;
        if (inferType === 'modelInfer') {
            defaultValues.region = regionMapping_1.default.getAvailableRegion(context, 'SageMaker', defaultValues.region);
        }
    }
    Object.assign(answers, await followUpQuestions(context, defaultValues, parameters));
    answers = { ...answers, service };
    Object.assign(defaultValues, answers);
    if (answers.access === 'authAndGuest') {
        await (0, enable_guest_auth_1.enableGuestAuth)(context, defaultValues.resourceName, true);
    }
    const { resourceName } = defaultValues;
    delete defaultValues.service;
    delete defaultValues.region;
    defaultValues.inferType = inferType;
    const resourceDirPath = path.join(projectBackendDirPath, category, resourceName);
    const amplifyMetaValues = {
        resourceName,
        service,
        inferType,
    };
    fs.ensureDirSync(resourceDirPath);
    const parametersFilePath = path.join(resourceDirPath, parametersFileName);
    const jsonString = JSON.stringify(defaultValues, null, 4);
    fs.writeFileSync(parametersFilePath, jsonString, 'utf8');
    if (!parameters.resourceName) {
        await copyCfnTemplate(context, category, resourceName, defaultValues);
    }
    addRegionMapping(context, resourceName, inferType);
    return amplifyMetaValues;
}
function addRegionMapping(context, resourceName, inferType) {
    const regionMapping = regionMapping_1.default.getRegionMapping(context, service, inferType);
    const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();
    const identifyCFNFilePath = path.join(projectBackendDirPath, category, resourceName, `${resourceName}-template.json`);
    const identifyCFNFile = context.amplify.readJsonFile(identifyCFNFilePath);
    identifyCFNFile.Mappings = regionMapping;
    const identifyCFNJSON = JSON.stringify(identifyCFNFile, null, 4);
    fs.writeFileSync(identifyCFNFilePath, identifyCFNJSON, 'utf8');
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
async function followUpQuestions(context, defaultValues, parameters) {
    var _a;
    const answers = {
        endpointConfig: await amplify_prompts_1.prompter.pick('Would you like to create your endpoint or load an use an existing endpoint?', [
            {
                name: 'Create an endpoint',
                value: 'create',
            },
            {
                name: 'Import an existing endpoint',
                value: 'import',
            },
        ]),
    };
    if (answers.endpointConfig === 'import') {
        Object.assign(answers, await getEndpoints(context, parameters));
    }
    if (answers.endpointConfig === 'create') {
        await createEndpoint(context, defaultValues);
        Object.assign(answers, await getEndpoints(context, parameters));
    }
    Object.assign(answers, {
        access: await amplify_prompts_1.prompter.pick('Who should have access?', [
            {
                name: 'Auth users only',
                value: 'auth',
            },
            {
                name: 'Auth and Guest users',
                value: 'authAndGuest',
            },
        ], { initial: (0, amplify_prompts_1.byValue)((_a = parameters.access) !== null && _a !== void 0 ? _a : 'auth') }),
    });
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
        Object.keys(categoryResources).forEach((resource) => {
            if (categoryResources[resource].service === authServiceName) {
                authExists = true;
            }
        });
    }
    return authExists;
}
function resourceAlreadyExists(context, inferType) {
    const { amplify } = context;
    const { amplifyMeta } = amplify.getProjectDetails();
    let type;
    if (amplifyMeta[category] && context.commandName !== 'update') {
        const categoryResources = amplifyMeta[category];
        Object.keys(categoryResources).forEach((resource) => {
            if (categoryResources[resource].inferType === inferType) {
                type = inferType;
            }
        });
    }
    return type;
}
async function getEndpoints(context, params) {
    const sagemaker = await context.amplify.executeProviderUtils(context, 'awscloudformation', 'getEndpoints');
    const endpoints = [];
    const endpointMap = {};
    sagemaker.Endpoints.forEach((endpoint) => {
        endpoints.push({ name: `${endpoint.EndpointName}` });
        endpointMap[endpoint.EndpointName] = { endpointName: endpoint.EndpointName, endpointARN: endpoint.EndpointArn };
    });
    if (endpoints.length < 1) {
        const errMessage = 'No existing endpoints!';
        context.print.error(errMessage);
        context.usageData.emitError(new amplify_cli_core_1.ResourceDoesNotExistError(errMessage));
        (0, amplify_cli_core_1.exitOnNextTick)(0);
    }
    const endpoint = await amplify_prompts_1.prompter.pick('Select an endpoint: ', endpoints, { initial: (0, amplify_prompts_1.byValue)(params.endpointName) });
    return endpointMap[endpoint];
}
async function createEndpoint(context, defaultValues) {
    const endpointConsoleUrl = `https://${defaultValues.region}.console.aws.amazon.com/sagemaker/home?region=${defaultValues.region}#/endpoints/create`;
    await (0, amplify_cli_core_1.open)(endpointConsoleUrl, { wait: false });
    context.print.info('SageMaker Console:');
    context.print.success(endpointConsoleUrl);
    await amplify_prompts_1.prompter.input('Press enter to continue');
}
module.exports = { addWalkthrough, updateWalkthrough };
//# sourceMappingURL=infer-walkthrough.js.map