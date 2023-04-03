"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.askAPICategoryDynamoDBQuestions = exports.getTableParameters = exports.askDynamoDBQuestions = void 0;
const inquirer_1 = __importDefault(require("inquirer"));
const path_1 = __importDefault(require("path"));
const TransformPackage = require('graphql-transformer-core');
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
async function askDynamoDBQuestions(context, currentProjectOnly = false) {
    const dynamoDbTypeQuestion = {
        type: 'list',
        name: 'dynamoDbType',
        message: 'Choose a DynamoDB data source option',
        choices: [
            {
                name: 'Use DynamoDB table configured in the current Amplify project',
                value: 'currentProject',
            },
            {
                name: 'Create a new DynamoDB table',
                value: 'newResource',
            },
        ],
    };
    for (let count = 0; count < 2; count++) {
        const dynamoDbTypeAnswer = currentProjectOnly ? { dynamoDbType: 'currentProject' } : await inquirer_1.default.prompt([dynamoDbTypeQuestion]);
        switch (dynamoDbTypeAnswer.dynamoDbType) {
            case 'currentProject': {
                const storageResources = context.amplify.getProjectDetails().amplifyMeta.storage;
                const dynamoDbProjectResources = [];
                if (!storageResources) {
                    context.print.error('There are no DynamoDB resources configured in your project currently');
                    break;
                }
                Object.keys(storageResources).forEach((resourceName) => {
                    if (storageResources[resourceName].service === 'DynamoDB') {
                        dynamoDbProjectResources.push(resourceName);
                    }
                });
                if (dynamoDbProjectResources.length === 0) {
                    context.print.error('There are no DynamoDB resources configured in your project currently');
                    break;
                }
                const dynamoResourceQuestion = {
                    type: 'list',
                    name: 'dynamoDbResources',
                    message: 'Choose from one of the already configured DynamoDB tables',
                    choices: dynamoDbProjectResources,
                };
                const dynamoResourceAnswer = await inquirer_1.default.prompt([dynamoResourceQuestion]);
                return { resourceName: dynamoResourceAnswer.dynamoDbResources };
            }
            case 'newResource': {
                const resourceName = await context.amplify.invokePluginMethod(context, 'storage', undefined, 'add', [
                    context,
                    'awscloudformation',
                    'DynamoDB',
                ]);
                context.print.success('Successfully added DynamoDb table locally');
                return { resourceName };
            }
            default:
                context.print.error('Invalid option selected');
        }
    }
    throw new Error('Invalid option selected');
}
exports.askDynamoDBQuestions = askDynamoDBQuestions;
async function getTableParameters(context, dynamoAnswers) {
    if (dynamoAnswers.Arn) {
        const hashKey = dynamoAnswers.KeySchema.find((attr) => attr.KeyType === 'HASH') || {};
        const hashType = dynamoAnswers.AttributeDefinitions.find((attr) => attr.AttributeName === hashKey.AttributeName) || {};
        const rangeKey = dynamoAnswers.KeySchema.find((attr) => attr.KeyType === 'RANGE') || {};
        const rangeType = dynamoAnswers.AttributeDefinitions.find((attr) => attr.AttributeName === rangeKey.AttributeName) || {};
        return {
            tableName: dynamoAnswers.TableName,
            partitionKeyName: hashKey.AttributeName,
            partitionKeyType: hashType.AttributeType,
            sortKeyName: rangeKey.AttributeName,
            sortKeyType: rangeType.AttributeType,
        };
    }
    return amplify_cli_core_1.stateManager.getResourceParametersJson(undefined, amplify_cli_core_1.AmplifyCategories.STORAGE, dynamoAnswers.resourceName, {
        throwIfNotExist: false,
        default: {},
    });
}
exports.getTableParameters = getTableParameters;
async function askAPICategoryDynamoDBQuestions(context) {
    const { allResources } = await context.amplify.getResourceStatus();
    const appSyncResources = allResources.filter((resource) => resource.service === 'AppSync');
    let targetResourceName;
    if (appSyncResources.length === 0) {
        const errMessage = `
      No AppSync resources have been configured in the API category.
      Please use "amplify add api" command to create a new appsync resource`;
        context.print.error(errMessage);
        await context.usageData.emitError(new amplify_cli_core_1.ResourceDoesNotExistError(errMessage));
        (0, amplify_cli_core_1.exitOnNextTick)(1);
    }
    else if (appSyncResources.length === 1) {
        targetResourceName = appSyncResources[0].resourceName;
        context.print.success(`Selected resource ${targetResourceName}`);
    }
    else {
        const resourceNameQuestion = {
            type: 'list',
            name: 'dynamoDbAPIResourceName',
            message: 'Choose an API resource to associate with',
            choices: appSyncResources.map((resource) => resource.resourceName),
        };
        const answer = await inquirer_1.default.prompt([resourceNameQuestion]);
        targetResourceName = answer.dynamoDbAPIResourceName;
    }
    const backendDir = context.amplify.pathManager.getBackendDirPath();
    const resourceDirPath = path_1.default.join(backendDir, 'api', targetResourceName);
    const project = await TransformPackage.readProjectConfiguration(resourceDirPath);
    const directiveMap = TransformPackage.collectDirectivesByTypeNames(project.schema);
    const modelNames = Object.keys(directiveMap.types).filter((typeName) => directiveMap.types[typeName].includes('model'));
    let targetModelNames = [];
    if (modelNames.length === 0) {
        throw Error('Unable to find graphql model info.');
    }
    else if (modelNames.length === 1) {
        const [modelName] = modelNames;
        context.print.success(`Selected @model ${modelName}`);
        targetModelNames = modelNames;
    }
    else {
        while (targetModelNames.length === 0) {
            const modelNameQuestion = {
                type: 'checkbox',
                name: 'graphqlAPIModelName',
                message: 'Choose the graphql @model(s)',
                choices: modelNames,
            };
            const modelNameAnswer = await inquirer_1.default.prompt([modelNameQuestion]);
            targetModelNames = modelNameAnswer.graphqlAPIModelName;
            if (targetModelNames.length === 0) {
                context.print.info('You need to select at least one @model');
            }
        }
    }
    const triggerEventSourceMappings = targetModelNames.map((modelName) => {
        const streamArnParamRef = {
            'Fn::ImportValue': {
                'Fn::Sub': [`\${api${targetResourceName}GraphQLAPIIdOutput}`, 'GetAtt', `${modelName}Table`, 'StreamArn'].join(':'),
            },
        };
        return {
            modelName,
            batchSize: 100,
            startingPosition: 'LATEST',
            eventSourceArn: streamArnParamRef,
            functionTemplateType: 'dynamoDB',
            functionTemplateName: 'DynamoDb.cs.ejs',
            triggerPolicies: [
                {
                    Effect: 'Allow',
                    Action: ['dynamodb:DescribeStream', 'dynamodb:GetRecords', 'dynamodb:GetShardIterator', 'dynamodb:ListStreams'],
                    Resource: streamArnParamRef,
                },
            ],
        };
    });
    return {
        triggerEventSourceMappings,
        dependsOn: [
            {
                category: 'api',
                resourceName: targetResourceName,
                attributes: ['GraphQLAPIIdOutput', 'GraphQLAPIEndpointOutput'],
            },
        ],
    };
}
exports.askAPICategoryDynamoDBQuestions = askAPICategoryDynamoDBQuestions;
//# sourceMappingURL=dynamoDBWalkthrough.js.map