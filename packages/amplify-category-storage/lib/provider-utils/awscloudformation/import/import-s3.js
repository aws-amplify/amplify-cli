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
exports.ensureHeadlessParameters = exports.importedS3EnvInit = exports.updateStateFiles = exports.importS3 = void 0;
const amplify_environment_parameters_1 = require("@aws-amplify/amplify-environment-parameters");
const amplify_cli_core_1 = require("amplify-cli-core");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const enquirer_1 = __importDefault(require("enquirer"));
const lodash_1 = __importDefault(require("lodash"));
const uuid_1 = require("uuid");
const s3_walkthrough_1 = require("../service-walkthroughs/s3-walkthrough");
const storage_configuration_helpers_1 = require("../storage-configuration-helpers");
const messages_1 = require("./messages");
const importS3 = async (context, serviceSelection, previousResourceParameters, providerPluginInstance, printSuccessMessage = true) => {
    var _a;
    const resourceName = (0, s3_walkthrough_1.resourceAlreadyExists)();
    if (resourceName && !previousResourceParameters) {
        const errMessage = 'Amazon S3 storage was already added to your project.';
        amplify_prompts_1.printer.warn(errMessage);
        await context.usageData.emitError(new amplify_cli_core_1.ResourceAlreadyExistsError(errMessage));
        (0, amplify_cli_core_1.exitOnNextTick)(0);
    }
    const providerPlugin = providerPluginInstance || (await (_a = serviceSelection.provider, Promise.resolve().then(() => __importStar(require(_a)))));
    const providerUtils = providerPlugin;
    const importServiceWalkthroughResult = await importServiceWalkthrough(context, serviceSelection.providerName, providerUtils, previousResourceParameters);
    if (!importServiceWalkthroughResult) {
        return undefined;
    }
    const { questionParameters, answers } = importServiceWalkthroughResult;
    const persistEnvParameters = !previousResourceParameters;
    const { envSpecificParameters } = await (0, exports.updateStateFiles)(context, questionParameters, answers, persistEnvParameters);
    if (printSuccessMessage) {
        printSuccess(answers.bucketName);
    }
    return {
        envSpecificParameters,
    };
};
exports.importS3 = importS3;
const printSuccess = (bucketName) => {
    amplify_prompts_1.printer.info('');
    amplify_prompts_1.printer.info(`✅ S3 Bucket '${bucketName}' was successfully imported.`);
    amplify_prompts_1.printer.info('');
    amplify_prompts_1.printer.info('Next steps:');
    amplify_prompts_1.printer.info('- This resource can now be accessed from REST APIs (`amplify add api`) and Functions (`amplify add function`)');
    amplify_prompts_1.printer.info('- Use Amplify Libraries to add, upload, and download objects to your frontend app');
    amplify_prompts_1.printer.info('  - iOS: https://docs.amplify.aws/lib/storage/getting-started/q/platform/ios');
    amplify_prompts_1.printer.info('  - Android: https://docs.amplify.aws/lib/storage/getting-started/q/platform/android');
    amplify_prompts_1.printer.info('  - JavaScript: https://docs.amplify.aws/lib/storage/getting-started/q/platform/js');
};
const importServiceWalkthrough = async (context, providerName, providerUtils, previousResourceParameters) => {
    await ensureAuth(context);
    const authResources = (await context.amplify.getResourceStatus('auth')).allResources.filter((r) => r.service === 'Cognito');
    if (authResources.length === 0) {
        throw new Error('No auth resource found. Please add it using amplify add auth');
    }
    const s3 = await providerUtils.createS3Service(context);
    const bucketList = await s3.listBuckets();
    if (lodash_1.default.isEmpty(bucketList)) {
        amplify_prompts_1.printer.info(messages_1.importMessages.NoS3BucketsToImport);
        return undefined;
    }
    const questionParameters = createParameters(providerName, bucketList);
    const projectConfig = context.amplify.getProjectConfig();
    const [shortId] = (0, uuid_1.v4)().split('-');
    const projectName = projectConfig.projectName.toLowerCase().replace(/[^A-Za-z0-9_]+/g, '_');
    const defaultAnswers = {
        resourceName: (previousResourceParameters === null || previousResourceParameters === void 0 ? void 0 : previousResourceParameters.resourceName) || `${projectName}${shortId}`,
    };
    const answers = { ...defaultAnswers };
    const enquirer = new enquirer_1.default(undefined, defaultAnswers);
    if (bucketList.length === 1) {
        answers.bucketName = bucketList[0].Name;
        amplify_prompts_1.printer.info(messages_1.importMessages.OneBucket(answers.bucketName));
    }
    else {
        const bucketNameList = bucketList.map((b) => b.Name);
        const bucketNameQuestion = {
            type: 'autocomplete',
            name: 'bucketName',
            message: messages_1.importMessages.BucketSelection,
            required: true,
            choices: bucketNameList,
            limit: 5,
            footer: messages_1.importMessages.AutoCompleteFooter,
        };
        const { bucketName } = await enquirer.prompt(bucketNameQuestion);
        answers.bucketName = bucketName;
    }
    questionParameters.region = await s3.getBucketLocation(answers.bucketName);
    return {
        questionParameters,
        answers,
    };
};
const ensureAuth = async (context) => {
    while (!(0, storage_configuration_helpers_1.checkIfAuthExists)()) {
        const addOrImportQuestion = {
            type: 'select',
            name: 'addOrImport',
            message: 'Do you want to add or import auth now?',
            required: true,
            choices: [
                {
                    message: 'Add auth',
                    value: 'add',
                },
                {
                    message: 'Import auth',
                    value: 'import',
                },
                {
                    message: 'Cancel import storage',
                    value: 'cancel',
                },
            ],
            header: 'You need to add auth (Amazon Cognito) to your project in order to add storage for user files.',
        };
        const addOrImportAnswer = await enquirer_1.default.prompt(addOrImportQuestion);
        if (addOrImportAnswer.addOrImport === 'cancel') {
            amplify_prompts_1.printer.info('');
            await context.usageData.emitSuccess();
            (0, amplify_cli_core_1.exitOnNextTick)(0);
        }
        else {
            try {
                if (addOrImportAnswer.addOrImport === 'add') {
                    await context.amplify.invokePluginMethod(context, 'auth', undefined, 'add', [context]);
                }
                else {
                    await context.amplify.invokePluginMethod(context, 'auth', undefined, 'importAuth', [context]);
                }
            }
            catch (e) {
                amplify_prompts_1.printer.error('The Auth plugin is not installed in the CLI. You need to install it to use this feature');
                await context.usageData.emitError(e);
                (0, amplify_cli_core_1.exitOnNextTick)(1);
            }
        }
    }
};
const createParameters = (providerName, bucketList) => {
    const questionParameters = {
        providerName,
        bucketList,
    };
    return questionParameters;
};
const updateStateFiles = async (context, questionParameters, answers, updateEnvSpecificParameters) => {
    const backendConfiguration = {
        service: 'S3',
        serviceType: 'imported',
        providerPlugin: questionParameters.providerName,
        dependsOn: [],
    };
    const resourceParameters = {
        resourceName: answers.resourceName,
        serviceType: 'imported',
    };
    amplify_cli_core_1.stateManager.setResourceParametersJson(undefined, 'storage', answers.resourceName, resourceParameters);
    const metaConfiguration = lodash_1.default.clone(backendConfiguration);
    metaConfiguration.output = createMetaOutput(answers, questionParameters);
    context.amplify.updateamplifyMetaAfterResourceAdd('storage', answers.resourceName, metaConfiguration, backendConfiguration, true);
    const envSpecificParameters = createEnvSpecificResourceParameters(answers, questionParameters);
    if (updateEnvSpecificParameters) {
        context.amplify.saveEnvResourceParameters(context, 'storage', answers.resourceName, envSpecificParameters);
    }
    return {
        backendConfiguration,
        resourceParameters,
        metaConfiguration,
        envSpecificParameters,
    };
};
exports.updateStateFiles = updateStateFiles;
const createMetaOutput = (answers, questionParameters) => {
    const output = {
        BucketName: answers.bucketName,
        Region: questionParameters.region,
    };
    return output;
};
const createEnvSpecificResourceParameters = (answers, questionParameters) => {
    const envSpecificResourceParameters = {
        bucketName: answers.bucketName,
        region: questionParameters.region,
    };
    return envSpecificResourceParameters;
};
const importedS3EnvInit = async (context, resourceName, resource, resourceParameters, providerName, providerUtils, currentEnvSpecificParameters, isInHeadlessMode, headlessParams) => {
    var _a, _b;
    const s3 = await providerUtils.createS3Service(context);
    const isPulling = context.input.command === 'pull' || (context.input.command === 'env' && ((_a = context.input.subCommands) === null || _a === void 0 ? void 0 : _a[0]) === 'pull');
    const isEnvAdd = context.input.command === 'env' && ((_b = context.input.subCommands) === null || _b === void 0 ? void 0 : _b[0]) === 'add';
    if (isInHeadlessMode) {
        return headlessImport(context, s3, providerName, resourceParameters, headlessParams, currentEnvSpecificParameters);
    }
    if (isPulling) {
        const currentMeta = amplify_cli_core_1.stateManager.getCurrentMeta(undefined, {
            throwIfNotExist: false,
        });
        if (currentMeta) {
            const currentResource = lodash_1.default.get(currentMeta, ['storage', resourceName], undefined);
            if (currentResource && currentResource.output) {
                const { BucketName, Region } = currentResource.output;
                currentEnvSpecificParameters.bucketName = BucketName;
                currentEnvSpecificParameters.region = Region;
            }
        }
    }
    else if (isEnvAdd && context.exeInfo.sourceEnvName) {
        const resourceParamManager = (await (0, amplify_environment_parameters_1.ensureEnvParamManager)(context.exeInfo.sourceEnvName)).instance.getResourceParamManager('storage', resourceName);
        if (resourceParamManager.hasAnyParams()) {
            const { importExisting } = await enquirer_1.default.prompt({
                name: 'importExisting',
                type: 'confirm',
                message: messages_1.importMessages.ImportPreviousBucket(resourceName, resourceParamManager.getParam('bucketName'), context.exeInfo.sourceEnvName),
                footer: messages_1.importMessages.ImportPreviousResourceFooter,
                initial: true,
                format: (e) => (e ? 'Yes' : 'No'),
            });
            if (!importExisting) {
                return {
                    doServiceWalkthrough: true,
                };
            }
            currentEnvSpecificParameters.bucketName = resourceParamManager.getParam('bucketName');
            currentEnvSpecificParameters.region = resourceParamManager.getParam('region');
        }
    }
    if (!(currentEnvSpecificParameters.bucketName && currentEnvSpecificParameters.region)) {
        amplify_prompts_1.printer.info(messages_1.importMessages.ImportNewResourceRequired(resourceName));
        return {
            doServiceWalkthrough: true,
        };
    }
    const questionParameters = {
        providerName,
        bucketList: [],
    };
    const answers = {
        resourceName: resourceParameters.resourceName,
        bucketName: currentEnvSpecificParameters.bucketName,
    };
    const bucketExists = await s3.bucketExists(currentEnvSpecificParameters.bucketName);
    if (!bucketExists) {
        amplify_prompts_1.printer.error(messages_1.importMessages.BucketNotFound(currentEnvSpecificParameters.bucketName));
        return {
            succeeded: false,
        };
    }
    questionParameters.region = await s3.getBucketLocation(answers.bucketName);
    const newState = await (0, exports.updateStateFiles)(context, questionParameters, answers, false);
    return {
        succeeded: true,
        envSpecificParameters: newState.envSpecificParameters,
    };
};
exports.importedS3EnvInit = importedS3EnvInit;
const headlessImport = async (context, s3, providerName, resourceParameters, headlessParams, currentEnvSpecificParameters) => {
    const resolvedEnvParams = (headlessParams === null || headlessParams === void 0 ? void 0 : headlessParams.bucketName) || (headlessParams === null || headlessParams === void 0 ? void 0 : headlessParams.region) ? (0, exports.ensureHeadlessParameters)(headlessParams) : currentEnvSpecificParameters;
    const questionParameters = {
        providerName,
        bucketList: [],
    };
    const answers = {
        resourceName: resourceParameters.resourceName,
        bucketName: resolvedEnvParams.bucketName,
    };
    const bucketExists = await s3.bucketExists(resolvedEnvParams.bucketName);
    if (!bucketExists) {
        throw new amplify_cli_core_1.AmplifyError('StorageImportError', { message: messages_1.importMessages.BucketNotFound(resolvedEnvParams.bucketName) });
    }
    questionParameters.region = await s3.getBucketLocation(answers.bucketName);
    const newState = await (0, exports.updateStateFiles)(context, questionParameters, answers, false);
    return {
        succeeded: true,
        envSpecificParameters: newState.envSpecificParameters,
    };
};
const ensureHeadlessParameters = (headlessParams) => {
    const missingParams = [];
    if (!headlessParams.bucketName) {
        missingParams.push('bucketName');
    }
    if (!headlessParams.region) {
        missingParams.push('region');
    }
    if (missingParams.length > 0) {
        throw new amplify_cli_core_1.AmplifyError('InputValidationError', {
            message: `storage headless is missing the following inputParams ${missingParams.join(', ')}`,
            link: 'https://docs.amplify.aws/cli/usage/headless/#--categories',
        });
    }
    const envSpecificParameters = {
        bucketName: headlessParams.bucketName,
        region: headlessParams.region,
    };
    return envSpecificParameters;
};
exports.ensureHeadlessParameters = ensureHeadlessParameters;
//# sourceMappingURL=import-s3.js.map