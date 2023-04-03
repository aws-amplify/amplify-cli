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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIAMPolicies = exports.migrate = exports.updateWalkthrough = exports.addWalkthrough = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const uuid_1 = require("uuid");
const ddb_stack_transform_1 = require("../cdk-stack-builder/ddb-stack-transform");
const dynamoDB_input_state_1 = require("./dynamoDB-input-state");
async function addWalkthrough(context, defaultValuesFilename) {
    amplify_prompts_1.printer.blankLine();
    amplify_prompts_1.printer.info('Welcome to the NoSQL DynamoDB database wizard');
    amplify_prompts_1.printer.info('This wizard asks you a series of questions to help determine how to set up your NoSQL database table.');
    amplify_prompts_1.printer.blankLine();
    const defaultValuesSrc = path.join(__dirname, '..', 'default-values', defaultValuesFilename);
    const { getAllDefaults } = await (_a = defaultValuesSrc, Promise.resolve().then(() => __importStar(require(_a))));
    const { amplify } = context;
    const defaultValues = getAllDefaults(amplify.getProjectDetails());
    const resourceName = await askResourceNameQuestion(defaultValues);
    const tableName = await askTableNameQuestion(defaultValues, resourceName);
    const { attributeAnswers, indexableAttributeList } = await askAttributeListQuestion();
    const partitionKey = await askPrimaryKeyQuestion(indexableAttributeList, attributeAnswers);
    const cliInputs = {
        resourceName,
        tableName,
        partitionKey,
    };
    cliInputs.sortKey = await askSortKeyQuestion(indexableAttributeList, attributeAnswers, cliInputs.partitionKey.fieldName);
    cliInputs.gsi = await askGSIQuestion(indexableAttributeList, attributeAnswers);
    cliInputs.triggerFunctions = await askTriggersQuestion(context, cliInputs.resourceName);
    const cliInputsState = new dynamoDB_input_state_1.DynamoDBInputState(context, cliInputs.resourceName);
    await cliInputsState.saveCliInputPayload(cliInputs);
    const stackGenerator = new ddb_stack_transform_1.DDBStackTransform(context, cliInputs.resourceName);
    await stackGenerator.transform();
    return cliInputs.resourceName;
}
exports.addWalkthrough = addWalkthrough;
async function updateWalkthrough(context) {
    var _a, _b, _c;
    const amplifyMeta = amplify_cli_core_1.stateManager.getMeta();
    const dynamoDbResources = {};
    Object.keys(amplifyMeta[amplify_cli_core_1.AmplifyCategories.STORAGE]).forEach((resourceName) => {
        if (amplifyMeta[amplify_cli_core_1.AmplifyCategories.STORAGE][resourceName].service === amplify_cli_core_1.AmplifySupportedService.DYNAMODB &&
            amplifyMeta[amplify_cli_core_1.AmplifyCategories.STORAGE][resourceName].mobileHubMigrated !== true &&
            amplifyMeta[amplify_cli_core_1.AmplifyCategories.STORAGE][resourceName].serviceType !== 'imported') {
            dynamoDbResources[resourceName] = amplifyMeta[amplify_cli_core_1.AmplifyCategories.STORAGE][resourceName];
        }
    });
    if (!amplifyMeta[amplify_cli_core_1.AmplifyCategories.STORAGE] || Object.keys(dynamoDbResources).length === 0) {
        const errMessage = 'No resources to update. You need to add a resource.';
        amplify_prompts_1.printer.error(errMessage);
        void context.usageData.emitError(new amplify_cli_core_1.ResourceDoesNotExistError(errMessage));
        (0, amplify_cli_core_1.exitOnNextTick)(0);
        return undefined;
    }
    const resources = Object.keys(dynamoDbResources);
    const resourceName = await amplify_prompts_1.prompter.pick('Specify the resource that you would want to update', resources);
    const cliInputsState = new dynamoDB_input_state_1.DynamoDBInputState(context, resourceName);
    const headlessMigrate = ((_a = context.input.options) === null || _a === void 0 ? void 0 : _a.yes) || ((_b = context.input.options) === null || _b === void 0 ? void 0 : _b.forcePush) || ((_c = context.input.options) === null || _c === void 0 ? void 0 : _c.headless);
    if (!cliInputsState.cliInputFileExists()) {
        if (headlessMigrate || (await amplify_prompts_1.prompter.yesOrNo((0, amplify_cli_core_1.getMigrateResourceMessageForOverride)(amplify_cli_core_1.AmplifyCategories.STORAGE, resourceName), true))) {
            await cliInputsState.migrate();
            const stackGenerator = new ddb_stack_transform_1.DDBStackTransform(context, resourceName);
            await stackGenerator.transform();
        }
        else {
            return undefined;
        }
    }
    const cliInputs = cliInputsState.getCliInputPayload();
    const existingAttributeDefinitions = [];
    if (cliInputs.partitionKey) {
        existingAttributeDefinitions.push(cliInputs.partitionKey);
    }
    if (cliInputs.sortKey) {
        existingAttributeDefinitions.push(cliInputs.sortKey);
    }
    if (cliInputs.gsi && cliInputs.gsi.length > 0) {
        cliInputs.gsi.forEach((gsi) => {
            if (gsi.partitionKey) {
                existingAttributeDefinitions.push(gsi.partitionKey);
            }
            if (gsi.sortKey) {
                existingAttributeDefinitions.push(gsi.sortKey);
            }
        });
    }
    if (!cliInputs.resourceName) {
        throw new Error('resourceName not found in cli-inputs');
    }
    const { attributeAnswers, indexableAttributeList } = await askAttributeListQuestion(existingAttributeDefinitions);
    cliInputs.gsi = await askGSIQuestion(indexableAttributeList, attributeAnswers, cliInputs.gsi);
    cliInputs.triggerFunctions = await askTriggersQuestion(context, cliInputs.resourceName, cliInputs.triggerFunctions);
    await cliInputsState.saveCliInputPayload(cliInputs);
    const stackGenerator = new ddb_stack_transform_1.DDBStackTransform(context, cliInputs.resourceName);
    await stackGenerator.transform();
    return cliInputs;
}
exports.updateWalkthrough = updateWalkthrough;
async function askTriggersQuestion(context, resourceName, existingTriggerFunctions) {
    const triggerFunctions = existingTriggerFunctions || [];
    if (!existingTriggerFunctions || existingTriggerFunctions.length === 0) {
        if (await amplify_prompts_1.prompter.confirmContinue('Do you want to add a Lambda Trigger for your Table?')) {
            let triggerName;
            try {
                triggerName = await addTrigger(context, resourceName);
                return [triggerName];
            }
            catch (e) {
                amplify_prompts_1.printer.error(e.message);
            }
        }
    }
    else {
        let triggerName;
        let continueWithTriggerOperationQuestion = true;
        while (continueWithTriggerOperationQuestion) {
            const triggerOperationAnswer = await amplify_prompts_1.prompter.pick('Select from the following options', [
                'Add a Trigger',
                'Remove a trigger',
                `I'm done`,
            ]);
            switch (triggerOperationAnswer) {
                case 'Add a Trigger': {
                    try {
                        triggerName = await addTrigger(context, resourceName, triggerFunctions);
                        triggerFunctions.push(triggerName);
                        continueWithTriggerOperationQuestion = false;
                    }
                    catch (e) {
                        amplify_prompts_1.printer.error(e.message);
                        continueWithTriggerOperationQuestion = true;
                    }
                    break;
                }
                case 'Remove a trigger': {
                    try {
                        if (triggerFunctions.length === 0) {
                            throw new Error('No triggers found associated with this table');
                        }
                        else {
                            triggerName = await removeTrigger(context, resourceName, triggerFunctions);
                            const index = triggerFunctions.indexOf(triggerName);
                            if (index >= 0) {
                                triggerFunctions.splice(index, 1);
                                continueWithTriggerOperationQuestion = false;
                            }
                            else {
                                throw new Error('Could not find trigger function');
                            }
                        }
                    }
                    catch (e) {
                        amplify_prompts_1.printer.error(e.message);
                        continueWithTriggerOperationQuestion = true;
                    }
                    break;
                }
                case `I'm done`: {
                    continueWithTriggerOperationQuestion = false;
                    break;
                }
                default:
                    amplify_prompts_1.printer.error(`${triggerOperationAnswer} not supported`);
            }
        }
    }
    return triggerFunctions;
}
async function askGSIQuestion(indexableAttributeList, attributeDefinitions, existingGSIList) {
    amplify_prompts_1.printer.blankLine();
    amplify_prompts_1.printer.info('You can optionally add global secondary indexes for this table. These are useful when you run queries defined in a different column than the primary key.');
    amplify_prompts_1.printer.info('To learn more about indexes, see:');
    amplify_prompts_1.printer.info('https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.CoreComponents.html#HowItWorks.CoreComponents.SecondaryIndexes');
    amplify_prompts_1.printer.blankLine();
    let gsiList = [];
    if (existingGSIList &&
        !!existingGSIList.length &&
        (await amplify_prompts_1.prompter.yesOrNo('Do you want to keep existing global secondary indexes created on your table?', true))) {
        gsiList = existingGSIList;
    }
    if (await amplify_prompts_1.prompter.yesOrNo('Do you want to add global secondary indexes to your table?', true)) {
        let continueWithGSIQuestions = true;
        while (continueWithGSIQuestions) {
            if (indexableAttributeList.length > 0) {
                const gsiNameValidator = (message) => (input) => /^[a-zA-Z0-9_-]+$/.test(input) ? true : message;
                const gsiName = await amplify_prompts_1.prompter.input('Provide the GSI name', {
                    validate: gsiNameValidator('You can use the following characters: a-z A-Z 0-9 - _'),
                });
                const gsiPartitionKeyName = await amplify_prompts_1.prompter.pick('Choose partition key for the GSI', [...new Set(indexableAttributeList)]);
                const gsiPrimaryKeyIndex = attributeDefinitions.findIndex((attr) => attr.AttributeName === gsiPartitionKeyName);
                const gsiItem = {
                    name: gsiName,
                    partitionKey: {
                        fieldName: gsiPartitionKeyName,
                        fieldType: attributeDefinitions[gsiPrimaryKeyIndex].AttributeType,
                    },
                };
                const sortKeyOptions = indexableAttributeList.filter((att) => att !== gsiPartitionKeyName);
                if (sortKeyOptions.length > 0) {
                    if (await amplify_prompts_1.prompter.yesOrNo('Do you want to add a sort key to your global secondary index?', true)) {
                        const gsiSortKeyName = await amplify_prompts_1.prompter.pick('Choose sort key for the GSI', [...new Set(sortKeyOptions)]);
                        const gsiSortKeyIndex = attributeDefinitions.findIndex((attr) => attr.AttributeName === gsiSortKeyName);
                        gsiItem.sortKey = {
                            fieldName: gsiSortKeyName,
                            fieldType: attributeDefinitions[gsiSortKeyIndex].AttributeType,
                        };
                    }
                }
                gsiList.push(gsiItem);
                continueWithGSIQuestions = await amplify_prompts_1.prompter.yesOrNo('Do you want to add more global secondary indexes to your table?', true);
            }
            else {
                amplify_prompts_1.printer.error('You do not have any other attributes remaining to configure');
                break;
            }
        }
    }
    return gsiList;
}
async function askSortKeyQuestion(indexableAttributeList, attributeDefinitions, partitionKeyFieldName) {
    if (await amplify_prompts_1.prompter.yesOrNo('Do you want to add a sort key to your table?', true)) {
        if (attributeDefinitions.length > 1) {
            const sortKeyName = await amplify_prompts_1.prompter.pick('Choose sort key for the table', indexableAttributeList.filter((att) => att !== partitionKeyFieldName));
            const sortKeyAttrTypeIndex = attributeDefinitions.findIndex((attr) => attr.AttributeName === sortKeyName);
            return {
                fieldName: sortKeyName,
                fieldType: attributeDefinitions[sortKeyAttrTypeIndex].AttributeType,
            };
        }
        else {
            amplify_prompts_1.printer.error('You must add additional keys in order to select a sort key.');
        }
    }
    return undefined;
}
async function askPrimaryKeyQuestion(indexableAttributeList, attributeDefinitions) {
    amplify_prompts_1.printer.blankLine();
    amplify_prompts_1.printer.info('Before you create the database, you must specify how items in your table are uniquely organized. You do this by specifying a primary key. The primary key uniquely identifies each item in the table so that no two items can have the same key. This can be an individual column, or a combination that includes a primary key and a sort key.');
    amplify_prompts_1.printer.blankLine();
    amplify_prompts_1.printer.info('To learn more about primary keys, see:');
    amplify_prompts_1.printer.info('https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.CoreComponents.html#HowItWorks.CoreComponents.PrimaryKey');
    amplify_prompts_1.printer.blankLine();
    const partitionKeyName = await amplify_prompts_1.prompter.pick('Choose partition key for the table', indexableAttributeList);
    const primaryAttrTypeIndex = attributeDefinitions.findIndex((attr) => attr.AttributeName === partitionKeyName);
    return {
        fieldName: partitionKeyName,
        fieldType: attributeDefinitions[primaryAttrTypeIndex].AttributeType,
    };
}
async function askAttributeListQuestion(existingAttributeDefinitions) {
    const attributeTypes = {
        string: { code: 'string', indexable: true },
        number: { code: 'number', indexable: true },
        binary: { code: 'binary', indexable: true },
        boolean: { code: 'boolean', indexable: false },
        list: { code: 'list', indexable: false },
        map: { code: 'map', indexable: false },
        null: { code: 'null', indexable: false },
        'string-set': { code: 'string-set', indexable: false },
        'number-set': { code: 'number-set', indexable: false },
        'binary-set': { code: 'binary-set', indexable: false },
    };
    amplify_prompts_1.printer.blankLine();
    amplify_prompts_1.printer.info('You can now add columns to the table.');
    amplify_prompts_1.printer.blankLine();
    let continueAttributeQuestion = true;
    let attributeAnswers = [];
    let indexableAttributeList = [];
    let existingAttributes = [];
    if (existingAttributeDefinitions) {
        existingAttributes = existingAttributeDefinitions.map((attr) => {
            return {
                AttributeName: attr.fieldName,
                AttributeType: attr.fieldType,
            };
        });
    }
    if (existingAttributes.length > 0) {
        attributeAnswers = existingAttributes;
        indexableAttributeList = attributeAnswers.map((attr) => attr.AttributeName);
        continueAttributeQuestion = await amplify_prompts_1.prompter.yesOrNo('Would you like to add another column?', true);
    }
    while (continueAttributeQuestion) {
        const attributeNameValidator = (message) => (input) => /^[a-zA-Z0-9_-]+$/.test(input) ? true : message;
        const attributeName = await amplify_prompts_1.prompter.input('What would you like to name this column', {
            validate: attributeNameValidator('You can use the following characters: a-z A-Z 0-9 - _'),
        });
        const attributeType = await amplify_prompts_1.prompter.pick('Choose the data type', Object.keys(attributeTypes));
        if (attributeAnswers.findIndex((attribute) => attribute.AttributeName === attributeName) !== -1) {
            continueAttributeQuestion = await amplify_prompts_1.prompter.confirmContinue('This attribute was already added. Do you want to add another attribute?');
            continue;
        }
        attributeAnswers.push({
            AttributeName: attributeName,
            AttributeType: attributeTypes[attributeType].code,
        });
        if (attributeTypes[attributeType].indexable) {
            indexableAttributeList.push(attributeName);
        }
        continueAttributeQuestion = await amplify_prompts_1.prompter.yesOrNo('Would you like to add another column?', true);
    }
    return { attributeAnswers, indexableAttributeList };
}
async function askTableNameQuestion(defaultValues, resourceName) {
    const tableNameValidator = (message) => (input) => /^[a-zA-Z0-9._-]+$/.test(input) ? true : message;
    const tableName = await amplify_prompts_1.prompter.input('Provide table name', {
        validate: tableNameValidator('You can use the following characters: a-z A-Z 0-9 . - _'),
        initial: resourceName || defaultValues['tableName'],
    });
    return tableName;
}
async function askResourceNameQuestion(defaultValues) {
    const resourceName = await amplify_prompts_1.prompter.input('Provide a friendly name', {
        validate: (0, amplify_prompts_1.alphanumeric)(),
        initial: defaultValues['resourceName'],
    });
    return resourceName;
}
async function removeTrigger(context, resourceName, triggerList) {
    const functionName = await amplify_prompts_1.prompter.pick('Select from the function you would like to remove', triggerList);
    const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();
    const functionCFNFilePath = path.join(projectBackendDirPath, 'function', functionName, `${functionName}-cloudformation-template.json`);
    if (fs.existsSync(functionCFNFilePath)) {
        const functionCFNFile = context.amplify.readJsonFile(functionCFNFilePath);
        delete functionCFNFile.Resources[`${resourceName}TriggerPolicy`];
        delete functionCFNFile.Resources[`${resourceName}Trigger`];
        const functionCFNString = JSON.stringify(functionCFNFile, null, 4);
        fs.writeFileSync(functionCFNFilePath, functionCFNString, 'utf8');
    }
    return functionName;
}
async function addTrigger(context, resourceName, triggerList) {
    const triggerTypeAnswer = await amplify_prompts_1.prompter.pick('Select from the following options', [
        'Choose an existing function from the project',
        'Create a new function',
    ]);
    let functionName;
    if (triggerTypeAnswer === 'Choose an existing function from the project') {
        let lambdaResources = await getLambdaFunctions(context);
        if (triggerList) {
            const filteredLambdaResources = [];
            lambdaResources.forEach((lambdaResource) => {
                if (triggerList.indexOf(lambdaResource) === -1) {
                    filteredLambdaResources.push(lambdaResource);
                }
            });
            lambdaResources = filteredLambdaResources;
        }
        if (lambdaResources.length === 0) {
            throw new Error("No functions were found in the project. Use 'amplify add function' to add a new function.");
        }
        functionName = await amplify_prompts_1.prompter.pick('Select from the following options', lambdaResources);
    }
    else {
        const targetDir = context.amplify.pathManager.getBackendDirPath();
        const [shortId] = (0, uuid_1.v4)().split('-');
        functionName = `${resourceName}Trigger${shortId}`;
        const pluginDir = __dirname;
        const defaults = {
            functionName: `${functionName}`,
            roleName: `${resourceName}LambdaRole${shortId}`,
        };
        const copyJobs = [
            {
                dir: pluginDir,
                template: path.join('..', '..', '..', '..', 'resources', 'triggers', 'dynamoDB', 'lambda-cloudformation-template.json.ejs'),
                target: path.join(targetDir, 'function', functionName, `${functionName}-cloudformation-template.json`),
            },
            {
                dir: pluginDir,
                template: path.join('..', '..', '..', '..', 'resources', 'triggers', 'dynamoDB', 'event.json'),
                target: path.join(targetDir, 'function', functionName, 'src', 'event.json'),
            },
            {
                dir: pluginDir,
                template: path.join('..', '..', '..', '..', 'resources', 'triggers', 'dynamoDB', 'index.js'),
                target: path.join(targetDir, 'function', functionName, 'src', 'index.js'),
            },
            {
                dir: pluginDir,
                template: path.join('..', '..', '..', '..', 'resources', 'triggers', 'dynamoDB', 'package.json.ejs'),
                target: path.join(targetDir, 'function', functionName, 'src', 'package.json'),
            },
        ];
        await context.amplify.copyBatch(context, copyJobs, defaults);
        const backendConfigs = {
            service: amplify_cli_core_1.AmplifySupportedService.LAMBDA,
            providerPlugin: 'awscloudformation',
            build: true,
        };
        context.amplify.updateamplifyMetaAfterResourceAdd('function', functionName, backendConfigs);
        amplify_prompts_1.printer.success(`Successfully added resource ${functionName} locally`);
    }
    const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();
    const functionCFNFilePath = path.join(projectBackendDirPath, 'function', functionName, `${functionName}-cloudformation-template.json`);
    if (fs.existsSync(functionCFNFilePath)) {
        const functionCFNFile = context.amplify.readJsonFile(functionCFNFilePath);
        functionCFNFile.Parameters[`storage${resourceName}Name`] = {
            Type: 'String',
            Default: `storage${resourceName}Name`,
        };
        functionCFNFile.Parameters[`storage${resourceName}Arn`] = {
            Type: 'String',
            Default: `storage${resourceName}Arn`,
        };
        functionCFNFile.Parameters[`storage${resourceName}StreamArn`] = {
            Type: 'String',
            Default: `storage${resourceName}Arn`,
        };
        functionCFNFile.Resources[`${resourceName}TriggerPolicy`] = {
            DependsOn: ['LambdaExecutionRole'],
            Type: 'AWS::IAM::Policy',
            Properties: {
                PolicyName: `lambda-trigger-policy-${resourceName}`,
                Roles: [
                    {
                        Ref: 'LambdaExecutionRole',
                    },
                ],
                PolicyDocument: {
                    Version: '2012-10-17',
                    Statement: [
                        {
                            Effect: 'Allow',
                            Action: ['dynamodb:DescribeStream', 'dynamodb:GetRecords', 'dynamodb:GetShardIterator', 'dynamodb:ListStreams'],
                            Resource: [
                                {
                                    Ref: `storage${resourceName}StreamArn`,
                                },
                            ],
                        },
                    ],
                },
            },
        };
        functionCFNFile.Resources[`${resourceName}Trigger`] = {
            Type: 'AWS::Lambda::EventSourceMapping',
            DependsOn: [`${resourceName}TriggerPolicy`],
            Properties: {
                BatchSize: 100,
                Enabled: true,
                EventSourceArn: {
                    Ref: `storage${resourceName}StreamArn`,
                },
                FunctionName: {
                    'Fn::GetAtt': ['LambdaFunction', 'Arn'],
                },
                StartingPosition: 'LATEST',
            },
        };
        const amplifyMetaFilePath = amplify_cli_core_1.pathManager.getAmplifyMetaFilePath();
        const amplifyMeta = context.amplify.readJsonFile(amplifyMetaFilePath);
        const resourceDependsOn = amplifyMeta.function[functionName].dependsOn || [];
        let resourceExists = false;
        resourceDependsOn.forEach((resource) => {
            if (resource.resourceName === resourceName) {
                resourceExists = true;
                resourceDependsOn.attributes = ['Name', 'Arn', 'StreamArn'];
            }
        });
        if (!resourceExists) {
            resourceDependsOn.push({
                category: amplify_cli_core_1.AmplifyCategories.STORAGE,
                resourceName,
                attributes: ['Name', 'Arn', 'StreamArn'],
            });
        }
        const functionCFNString = JSON.stringify(functionCFNFile, null, 4);
        fs.writeFileSync(functionCFNFilePath, functionCFNString, 'utf8');
        context.amplify.updateamplifyMetaAfterResourceUpdate('function', functionName, 'dependsOn', resourceDependsOn);
        amplify_prompts_1.printer.success(`Successfully updated resource ${functionName} locally`);
        if (await amplify_prompts_1.prompter.confirmContinue(`Do you want to edit the local ${functionName} lambda function now?`)) {
            await context.amplify.openEditor(context, `${projectBackendDirPath}/function/${functionName}/src/index.js`);
        }
    }
    else {
        throw new Error(`Function ${functionName} does not exist`);
    }
    return functionName;
}
async function getLambdaFunctions(context) {
    const { allResources } = await context.amplify.getResourceStatus();
    const lambdaResources = allResources
        .filter((resource) => resource.service === amplify_cli_core_1.AmplifySupportedService.LAMBDA)
        .map((resource) => resource.resourceName);
    return lambdaResources;
}
function migrate(context, projectPath, resourceName) {
    const resourceDirPath = path.join(projectPath, 'amplify', 'backend', amplify_cli_core_1.AmplifyCategories.STORAGE, resourceName);
    const cfnFilePath = path.join(resourceDirPath, `${resourceName}-cloudformation-template.json`);
    const removeDanglingCommas = (value) => {
        const regex = /,(?!\s*?[{["'\w])/g;
        return value.replace(regex, '');
    };
    let oldCfnString = fs.readFileSync(cfnFilePath, 'utf8');
    oldCfnString = removeDanglingCommas(oldCfnString);
    const oldCfn = JSON.parse(oldCfnString);
    const newCfn = {};
    Object.assign(newCfn, oldCfn);
    if (!newCfn.Parameters) {
        newCfn.Parameters = {};
    }
    newCfn.Parameters.env = {
        Type: 'String',
    };
    if (!newCfn.Conditions) {
        newCfn.Conditions = {};
    }
    newCfn.Conditions.ShouldNotCreateEnvResources = {
        'Fn::Equals': [
            {
                Ref: 'env',
            },
            'NONE',
        ],
    };
    newCfn.Resources.DynamoDBTable.Properties.TableName = {
        'Fn::If': [
            'ShouldNotCreateEnvResources',
            {
                Ref: 'tableName',
            },
            {
                'Fn::Join': [
                    '',
                    [
                        {
                            Ref: 'tableName',
                        },
                        '-',
                        {
                            Ref: 'env',
                        },
                    ],
                ],
            },
        ],
    };
    const jsonString = JSON.stringify(newCfn, null, '\t');
    fs.writeFileSync(cfnFilePath, jsonString, 'utf8');
}
exports.migrate = migrate;
function getIAMPolicies(resourceName, crudOptions) {
    let policy = {};
    const actions = [];
    crudOptions.forEach((crudOption) => {
        switch (crudOption) {
            case 'create':
                actions.push('dynamodb:Put*', 'dynamodb:Create*', 'dynamodb:BatchWriteItem');
                break;
            case 'update':
                actions.push('dynamodb:Update*', 'dynamodb:RestoreTable*');
                break;
            case 'read':
                actions.push('dynamodb:Get*', 'dynamodb:BatchGetItem', 'dynamodb:List*', 'dynamodb:Describe*', 'dynamodb:Scan', 'dynamodb:Query');
                break;
            case 'delete':
                actions.push('dynamodb:Delete*');
                break;
            default:
                console.log(`${crudOption} not supported`);
        }
    });
    policy = {
        Effect: 'Allow',
        Action: actions,
        Resource: crudOptions.customPolicyResource
            ? crudOptions.customPolicyResource
            : [
                { Ref: `${amplify_cli_core_1.AmplifyCategories.STORAGE}${resourceName}Arn` },
                {
                    'Fn::Join': [
                        '/',
                        [
                            {
                                Ref: `${amplify_cli_core_1.AmplifyCategories.STORAGE}${resourceName}Arn`,
                            },
                            'index/*',
                        ],
                    ],
                },
            ],
    };
    const attributes = ['Name', 'Arn', 'StreamArn'];
    return { policy, attributes };
}
exports.getIAMPolicies = getIAMPolicies;
//# sourceMappingURL=dynamoDb-walkthrough.js.map