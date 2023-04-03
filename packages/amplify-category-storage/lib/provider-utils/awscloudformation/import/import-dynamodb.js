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
exports.ensureHeadlessParameters = exports.importedDynamoDBEnvInit = exports.importDynamoDB = void 0;
const amplify_environment_parameters_1 = require("@aws-amplify/amplify-environment-parameters");
const amplify_cli_core_1 = require("amplify-cli-core");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const enquirer_1 = __importDefault(require("enquirer"));
const lodash_1 = __importDefault(require("lodash"));
const messages_1 = require("./messages");
const importDynamoDB = async (context, serviceSelection, previousResourceParameters, providerPluginInstance, printSuccessMessage = true) => {
    var _a;
    const providerPlugin = providerPluginInstance || (await (_a = serviceSelection.provider, Promise.resolve().then(() => __importStar(require(_a)))));
    const providerUtils = providerPlugin;
    const importServiceWalkthroughResult = await importServiceWalkthrough(context, serviceSelection.providerName, providerUtils, previousResourceParameters);
    if (!importServiceWalkthroughResult) {
        return undefined;
    }
    const { questionParameters, answers } = importServiceWalkthroughResult;
    const persistEnvParameters = !previousResourceParameters;
    const { envSpecificParameters } = await updateStateFiles(context, questionParameters, answers, persistEnvParameters);
    if (printSuccessMessage) {
        printSuccess(answers.tableName);
    }
    return {
        envSpecificParameters,
    };
};
exports.importDynamoDB = importDynamoDB;
const printSuccess = (tableName) => {
    amplify_prompts_1.printer.blankLine();
    amplify_prompts_1.printer.info(`✅ DynamoDB Table '${tableName}' was successfully imported.`);
    amplify_prompts_1.printer.blankLine();
    amplify_prompts_1.printer.info('Next steps:');
    amplify_prompts_1.printer.info('- This resource can now be accessed from REST APIs (`amplify add api`) and Functions (`amplify add function`)');
};
const importServiceWalkthrough = async (context, providerName, providerUtils, previousResourceParameters) => {
    const dynamoDB = await providerUtils.createDynamoDBService(context);
    const amplifyMeta = amplify_cli_core_1.stateManager.getMeta();
    const { Region } = amplifyMeta.providers[providerName];
    let tableList = await dynamoDB.listTables();
    const storageResources = (Object.values(lodash_1.default.get(amplifyMeta, [amplify_cli_core_1.AmplifyCategories.STORAGE], [])));
    const dynamoDBResources = storageResources
        .filter((r) => r.service === 'DynamoDB' && !!r.output && !!r.output.Name)
        .map((r) => r.output.Name);
    tableList = tableList.filter((t) => !dynamoDBResources.includes(t));
    if (lodash_1.default.isEmpty(tableList)) {
        amplify_prompts_1.printer.info(messages_1.importMessages.NoDynamoDBTablesToImport);
        return undefined;
    }
    const questionParameters = createParameters(providerName, tableList);
    questionParameters.region = Region;
    const defaultAnswers = {
        resourceName: previousResourceParameters === null || previousResourceParameters === void 0 ? void 0 : previousResourceParameters.resourceName,
    };
    const answers = { ...defaultAnswers };
    const enquirer = new enquirer_1.default(undefined, defaultAnswers);
    if (tableList.length === 1) {
        answers.tableName = tableList[0];
        answers.resourceName = answers.tableName.replace(/[\W_]+/g, '');
        answers.tableDescription = await dynamoDB.getTableDetails(answers.tableName);
        amplify_prompts_1.printer.info(messages_1.importMessages.OneTable(answers.tableName));
    }
    else {
        const tableNameQuestion = {
            type: 'autocomplete',
            name: 'tableName',
            message: messages_1.importMessages.TableSelection,
            required: true,
            choices: tableList,
            limit: 5,
            footer: messages_1.importMessages.AutoCompleteFooter,
        };
        const { tableName } = await enquirer.prompt(tableNameQuestion);
        answers.tableName = tableName;
        answers.resourceName = answers.tableName.replace(/[\W_]+/g, '');
        answers.tableDescription = await dynamoDB.getTableDetails(answers.tableName);
    }
    return {
        questionParameters,
        answers,
    };
};
const createParameters = (providerName, tableList) => {
    const questionParameters = {
        providerName,
        tableList,
    };
    return questionParameters;
};
const updateStateFiles = async (context, questionParameters, answers, updateEnvSpecificParameters) => {
    const backendConfiguration = {
        service: 'DynamoDB',
        serviceType: 'imported',
        providerPlugin: questionParameters.providerName,
        dependsOn: [],
    };
    const resourceParameters = {
        resourceName: answers.resourceName,
        serviceType: 'imported',
    };
    amplify_cli_core_1.stateManager.setResourceParametersJson(undefined, amplify_cli_core_1.AmplifyCategories.STORAGE, answers.resourceName, resourceParameters);
    const metaConfiguration = lodash_1.default.clone(backendConfiguration);
    metaConfiguration.output = createMetaOutput(answers, questionParameters);
    context.amplify.updateamplifyMetaAfterResourceAdd(amplify_cli_core_1.AmplifyCategories.STORAGE, answers.resourceName, metaConfiguration, backendConfiguration, true);
    const envSpecificParameters = createEnvSpecificResourceParameters(answers, questionParameters);
    if (updateEnvSpecificParameters) {
        context.amplify.saveEnvResourceParameters(context, amplify_cli_core_1.AmplifyCategories.STORAGE, answers.resourceName, envSpecificParameters);
    }
    return {
        backendConfiguration,
        resourceParameters,
        metaConfiguration,
        envSpecificParameters,
    };
};
const createMetaOutput = (answers, questionParameters) => {
    var _a, _b, _c, _d;
    const output = {
        Name: answers.tableName,
        Region: questionParameters.region,
        Arn: answers.tableDescription.TableArn,
        StreamArn: answers.tableDescription.LatestStreamArn,
    };
    const hashKey = (_a = answers.tableDescription.KeySchema) === null || _a === void 0 ? void 0 : _a.find((ks) => ks.KeyType === 'HASH');
    const sortKeys = (_b = answers.tableDescription.KeySchema) === null || _b === void 0 ? void 0 : _b.filter((ks) => ks.KeyType === 'RANGE');
    if (hashKey) {
        const attribute = (_c = answers.tableDescription.AttributeDefinitions) === null || _c === void 0 ? void 0 : _c.find((a) => a.AttributeName === hashKey.AttributeName);
        if (attribute) {
            output.PartitionKeyName = hashKey.AttributeName;
            output.PartitionKeyType = attribute.AttributeType;
        }
    }
    if (sortKeys && sortKeys.length > 0) {
        const attribute = (_d = answers.tableDescription.AttributeDefinitions) === null || _d === void 0 ? void 0 : _d.find((a) => a.AttributeName === sortKeys[0].AttributeName);
        if (attribute) {
            output.SortKeyName = sortKeys[0].AttributeName;
            output.SortKeyType = attribute.AttributeType;
        }
    }
    return output;
};
const createEnvSpecificResourceParameters = (answers, questionParameters) => {
    var _a, _b, _c, _d;
    const envSpecificResourceParameters = {
        tableName: answers.tableName,
        region: questionParameters.region,
        arn: answers.tableDescription.TableArn,
        streamArn: answers.tableDescription.LatestStreamArn,
    };
    const hashKey = (_a = answers.tableDescription.KeySchema) === null || _a === void 0 ? void 0 : _a.find((ks) => ks.KeyType === 'HASH');
    const sortKeys = (_b = answers.tableDescription.KeySchema) === null || _b === void 0 ? void 0 : _b.filter((ks) => ks.KeyType === 'RANGE');
    if (hashKey) {
        const attribute = (_c = answers.tableDescription.AttributeDefinitions) === null || _c === void 0 ? void 0 : _c.find((a) => a.AttributeName === hashKey.AttributeName);
        if (attribute) {
            envSpecificResourceParameters.partitionKeyName = hashKey.AttributeName;
            envSpecificResourceParameters.partitionKeyType = attribute.AttributeType;
        }
    }
    if (sortKeys && sortKeys.length > 0) {
        const attribute = (_d = answers.tableDescription.AttributeDefinitions) === null || _d === void 0 ? void 0 : _d.find((a) => a.AttributeName === sortKeys[0].AttributeName);
        if (attribute) {
            envSpecificResourceParameters.sortKeyName = sortKeys[0].AttributeName;
            envSpecificResourceParameters.sortKeyType = attribute.AttributeType;
        }
    }
    return envSpecificResourceParameters;
};
const importedDynamoDBEnvInit = async (context, resourceName, resource, resourceParameters, providerName, providerUtils, currentEnvSpecificParameters, isInHeadlessMode, headlessParams) => {
    var _a, _b;
    const dynamoDB = await providerUtils.createDynamoDBService(context);
    const amplifyMeta = amplify_cli_core_1.stateManager.getMeta();
    const { Region } = amplifyMeta.providers[providerName];
    const isPulling = context.input.command === 'pull' || (context.input.command === 'env' && ((_a = context.input.subCommands) === null || _a === void 0 ? void 0 : _a[0]) === 'pull');
    const isEnvAdd = context.input.command === 'env' && ((_b = context.input.subCommands) === null || _b === void 0 ? void 0 : _b[0]) === 'add';
    if (isInHeadlessMode) {
        return headlessImport(context, dynamoDB, providerName, resourceParameters, headlessParams, currentEnvSpecificParameters);
    }
    if (isPulling) {
        const currentMeta = amplify_cli_core_1.stateManager.getCurrentMeta(undefined, {
            throwIfNotExist: false,
        });
        if (currentMeta) {
            const currentResource = lodash_1.default.get(currentMeta, [amplify_cli_core_1.AmplifyCategories.STORAGE, resourceName], undefined);
            if (currentResource && currentResource.output) {
                const { Name, Region, Arn, StreamArn, PartitionKeyName, PartitionKeyType, SortKeyName, SortKeyType, } = currentResource.output;
                currentEnvSpecificParameters.tableName = Name;
                currentEnvSpecificParameters.region = Region;
                currentEnvSpecificParameters.arn = Arn;
                currentEnvSpecificParameters.streamArn = StreamArn;
                currentEnvSpecificParameters.partitionKeyName = PartitionKeyName;
                currentEnvSpecificParameters.partitionKeyType = PartitionKeyType;
                currentEnvSpecificParameters.sortKeyName = SortKeyName;
                currentEnvSpecificParameters.sortKeyType = SortKeyType;
            }
        }
    }
    else if (isEnvAdd && context.exeInfo.sourceEnvName) {
        const resourceParamManager = (await (0, amplify_environment_parameters_1.ensureEnvParamManager)(context.exeInfo.sourceEnvName)).instance.getResourceParamManager(amplify_cli_core_1.AmplifyCategories.STORAGE, resourceName);
        if (resourceParamManager.hasAnyParams()) {
            const { importExisting } = await enquirer_1.default.prompt({
                name: 'importExisting',
                type: 'confirm',
                message: messages_1.importMessages.ImportPreviousTable(resourceName, resourceParamManager.getParam(DynamoDBParam.TABLE_NAME), context.exeInfo.sourceEnvName),
                footer: messages_1.importMessages.ImportPreviousResourceFooter,
                initial: true,
                format: (e) => (e ? 'Yes' : 'No'),
            });
            if (!importExisting) {
                return {
                    doServiceWalkthrough: true,
                };
            }
            currentEnvSpecificParameters.tableName = resourceParamManager.getParam(DynamoDBParam.TABLE_NAME);
            currentEnvSpecificParameters.region = resourceParamManager.getParam(DynamoDBParam.REGION);
            currentEnvSpecificParameters.arn = resourceParamManager.getParam(DynamoDBParam.ARN);
            currentEnvSpecificParameters.streamArn = resourceParamManager.getParam(DynamoDBParam.STREAM_ARN);
            currentEnvSpecificParameters.partitionKeyName = resourceParamManager.getParam(DynamoDBParam.PARTITION_KEY_NAME);
            currentEnvSpecificParameters.partitionKeyType = resourceParamManager.getParam(DynamoDBParam.PARTITION_KEY_TYPE);
            currentEnvSpecificParameters.sortKeyName = resourceParamManager.getParam(DynamoDBParam.SORT_KEY_NAME);
            currentEnvSpecificParameters.sortKeyType = resourceParamManager.getParam(DynamoDBParam.SORT_KEY_TYPE);
        }
    }
    if (!(currentEnvSpecificParameters.tableName && currentEnvSpecificParameters.region)) {
        amplify_prompts_1.printer.info(messages_1.importMessages.ImportNewResourceRequired(resourceName));
        return {
            doServiceWalkthrough: true,
        };
    }
    const questionParameters = {
        providerName,
        tableList: [],
        region: Region,
    };
    const answers = {
        resourceName: resourceParameters.resourceName,
        tableName: currentEnvSpecificParameters.tableName,
    };
    const tableExists = await dynamoDB.tableExists(currentEnvSpecificParameters.tableName);
    if (!tableExists) {
        amplify_prompts_1.printer.error(messages_1.importMessages.TableNotFound(currentEnvSpecificParameters.tableName));
        return {
            succeeded: false,
        };
    }
    answers.tableDescription = await dynamoDB.getTableDetails(currentEnvSpecificParameters.tableName);
    const newState = await updateStateFiles(context, questionParameters, answers, false);
    return {
        succeeded: true,
        envSpecificParameters: newState.envSpecificParameters,
    };
};
exports.importedDynamoDBEnvInit = importedDynamoDBEnvInit;
const headlessImport = async (context, dynamoDB, providerName, resourceParameters, headlessParams, currentEnvSpecificParameters) => {
    const resolvedEnvParams = (headlessParams === null || headlessParams === void 0 ? void 0 : headlessParams.tables) || (headlessParams === null || headlessParams === void 0 ? void 0 : headlessParams.region)
        ? (0, exports.ensureHeadlessParameters)(resourceParameters, headlessParams)
        : currentEnvSpecificParameters;
    const amplifyMeta = amplify_cli_core_1.stateManager.getMeta();
    const { Region } = amplifyMeta.providers[providerName];
    const questionParameters = {
        providerName,
        tableList: [],
        region: Region,
    };
    const answers = {
        resourceName: resourceParameters.resourceName,
        tableName: resolvedEnvParams.tableName,
    };
    const tableExists = await dynamoDB.tableExists(resolvedEnvParams.tableName);
    if (!tableExists) {
        throw new amplify_cli_core_1.AmplifyError('StorageImportError', { message: messages_1.importMessages.TableNotFound(resolvedEnvParams.tableName) });
    }
    answers.tableDescription = await dynamoDB.getTableDetails(resolvedEnvParams.tableName);
    const newState = await updateStateFiles(context, questionParameters, answers, false);
    return {
        succeeded: true,
        envSpecificParameters: newState.envSpecificParameters,
    };
};
const ensureHeadlessParameters = (resourceParameters, headlessParams) => {
    const missingParams = [];
    if (!headlessParams.tables) {
        missingParams.push('tables');
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
    const tableParams = Object.keys(headlessParams.tables).filter((t) => t === resourceParameters.resourceName);
    if ((tableParams === null || tableParams === void 0 ? void 0 : tableParams.length) !== 1) {
        throw new amplify_cli_core_1.AmplifyError('InputValidationError', {
            message: `storage headless expected 1 element for resource: ${resourceParameters.resourceName}, but found: ${tableParams.length}`,
            link: 'https://docs.amplify.aws/cli/usage/headless/#--categories',
        });
    }
    const envSpecificParameters = {
        tableName: headlessParams.tables[tableParams[0]],
        region: headlessParams.region,
    };
    return envSpecificParameters;
};
exports.ensureHeadlessParameters = ensureHeadlessParameters;
var DynamoDBParam;
(function (DynamoDBParam) {
    DynamoDBParam["TABLE_NAME"] = "tableName";
    DynamoDBParam["REGION"] = "region";
    DynamoDBParam["ARN"] = "arn";
    DynamoDBParam["STREAM_ARN"] = "streamArn";
    DynamoDBParam["PARTITION_KEY_NAME"] = "partitionKeyName";
    DynamoDBParam["PARTITION_KEY_TYPE"] = "partitionKeyType";
    DynamoDBParam["SORT_KEY_NAME"] = "sortKeyName";
    DynamoDBParam["SORT_KEY_TYPE"] = "sortKeyType";
})(DynamoDBParam || (DynamoDBParam = {}));
//# sourceMappingURL=import-dynamodb.js.map