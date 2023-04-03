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
exports.constructCloudWatchEventComponent = exports.constructCFModelTableNameComponent = exports.constructCFModelTableArnComponent = exports.getIAMPolicies = exports.getNewCFNParameters = exports.getNewCFNEnvVariables = exports.setFunctionCloudFormationTemplate = exports.getFunctionCloudFormationTemplate = void 0;
const constants_1 = require("./constants");
const appSyncHelper_1 = require("./appSyncHelper");
const path = __importStar(require("path"));
const amplify_cli_core_1 = require("amplify-cli-core");
const constants_2 = require("../../../constants");
const graphql_transformer_core_1 = require("graphql-transformer-core");
const functionCloudFormationFilePath = (functionName) => path.join(amplify_cli_core_1.pathManager.getBackendDirPath(), constants_2.categoryName, functionName, `${functionName}-cloudformation-template.json`);
const getFunctionCloudFormationTemplate = async (functionName) => {
    const { cfnTemplate } = (0, amplify_cli_core_1.readCFNTemplate)(functionCloudFormationFilePath(functionName));
    return cfnTemplate;
};
exports.getFunctionCloudFormationTemplate = getFunctionCloudFormationTemplate;
const setFunctionCloudFormationTemplate = async (functionName, cfnTemplate) => (0, amplify_cli_core_1.writeCFNTemplate)(cfnTemplate, functionCloudFormationFilePath(functionName));
exports.setFunctionCloudFormationTemplate = setFunctionCloudFormationTemplate;
function getNewCFNEnvVariables(oldCFNEnvVariables, currentDefaults, newCFNEnvVariables, newDefaults, apiResourceName) {
    const currentResources = [];
    const newResources = [];
    let deletedResources = [];
    const categorySet = new Set();
    if (currentDefaults.permissions) {
        Object.keys(currentDefaults.permissions).forEach((category) => {
            Object.keys(currentDefaults.permissions[category]).forEach((resourceName) => {
                categorySet.add(category);
                currentResources.push(`${category.toUpperCase()}_${resourceName.toUpperCase()}_`);
            });
        });
    }
    if (newDefaults.permissions) {
        Object.keys(newDefaults.permissions).forEach((category) => {
            Object.keys(newDefaults.permissions[category]).forEach((resourceName) => {
                newResources.push(`${category.toUpperCase()}_${resourceName.toUpperCase()}_`);
            });
        });
    }
    if (apiResourceName) {
        apiResourceAddCheck(currentResources, newResources, apiResourceName, categorySet, true);
    }
    currentResources.forEach((resourceName) => {
        if (newResources.indexOf(resourceName) === -1) {
            deletedResources.push(resourceName);
        }
    });
    const deleteAppSyncTableResources = deletedResources.filter((resource) => resource.includes(constants_1.appsyncTableSuffix.toUpperCase()));
    deletedResources = deletedResources.filter((resource) => !resource.includes(constants_1.appsyncTableSuffix.toUpperCase()));
    deleteAppSyncTableResources.forEach((table) => {
        const appsyncResourceName = (0, appSyncHelper_1.getAppSyncResourceName)();
        const replacementTableSuffix = `:${constants_1.appsyncTableSuffix.toUpperCase()}_`;
        const modelEnvPrefix = `API_${appsyncResourceName.toUpperCase()}_${table
            .replace(replacementTableSuffix, 'TABLE')
            .replace('STORAGE_', '')}`;
        const modelEnvNameKey = `${modelEnvPrefix}_NAME`;
        const modelEnvArnKey = `${modelEnvPrefix}_ARN`;
        deletedResources.push(modelEnvNameKey);
        deletedResources.push(modelEnvArnKey);
    });
    const toBeDeletedEnvVariables = [];
    Object.keys(oldCFNEnvVariables).forEach((envVar) => {
        for (let i = 0; i < deletedResources.length; i += 1) {
            if (envVar.includes(deletedResources[i])) {
                toBeDeletedEnvVariables.push(envVar);
                break;
            }
        }
    });
    toBeDeletedEnvVariables.forEach((envVar) => {
        delete oldCFNEnvVariables[envVar];
    });
    Object.assign(oldCFNEnvVariables, newCFNEnvVariables);
    return oldCFNEnvVariables;
}
exports.getNewCFNEnvVariables = getNewCFNEnvVariables;
function getNewCFNParameters(oldCFNParameters, currentDefaults, newCFNResourceParameters, newDefaults, apiResourceName) {
    const currentResources = [];
    const newResources = [];
    const deletedResources = [];
    const categorySet = new Set();
    if (currentDefaults.permissions) {
        Object.keys(currentDefaults.permissions).forEach((category) => {
            Object.keys(currentDefaults.permissions[category]).forEach((resourceName) => {
                categorySet.add(category);
                currentResources.push(`${category}${resourceName}`);
            });
        });
    }
    if (newDefaults.permissions) {
        Object.keys(newDefaults.permissions).forEach((category) => {
            Object.keys(newDefaults.permissions[category]).forEach((resourceName) => {
                newResources.push(`${category}${resourceName}`);
            });
        });
    }
    if (apiResourceName) {
        apiResourceAddCheck(currentResources, newResources, apiResourceName, categorySet, false);
    }
    currentResources.forEach((resourceName) => {
        if (newResources.indexOf(resourceName) === -1) {
            deletedResources.push(resourceName);
        }
    });
    const toBeDeletedParameters = [];
    Object.keys(oldCFNParameters).forEach((parameter) => {
        for (let i = 0; i < deletedResources.length; i += 1) {
            if (parameter.includes(deletedResources[i])) {
                toBeDeletedParameters.push(parameter);
                break;
            }
        }
    });
    toBeDeletedParameters.forEach((parameter) => {
        delete oldCFNParameters[parameter];
    });
    Object.assign(oldCFNParameters, newCFNResourceParameters);
    return oldCFNParameters;
}
exports.getNewCFNParameters = getNewCFNParameters;
function getIAMPolicies(resourceName, crudOptions) {
    let policy = {};
    const actions = [];
    crudOptions.forEach((crudOption) => {
        switch (crudOption) {
            case 'create':
                actions.push('lambda:Create*', 'lambda:Put*', 'lambda:Add*');
                break;
            case 'update':
                actions.push('lambda:Update*');
                break;
            case 'read':
                actions.push('lambda:Get*', 'lambda:List*', 'lambda:Invoke*');
                break;
            case 'delete':
                actions.push('lambda:Delete*', 'lambda:Remove*');
                break;
            default:
                console.log(`${crudOption} not supported`);
        }
    });
    policy = {
        Effect: 'Allow',
        Action: actions,
        Resource: [
            {
                'Fn::Join': [
                    '',
                    [
                        'arn:aws:lambda:',
                        {
                            Ref: 'AWS::Region',
                        },
                        ':',
                        { Ref: 'AWS::AccountId' },
                        ':function:',
                        {
                            Ref: `${constants_2.categoryName}${resourceName}Name`,
                        },
                    ],
                ],
            },
        ],
    };
    const attributes = ['Name'];
    return { policy, attributes };
}
exports.getIAMPolicies = getIAMPolicies;
async function constructCFModelTableArnComponent(appsyncResourceName, resourceName, appsyncTableSuffix) {
    return [
        'arn:aws:dynamodb:',
        { Ref: 'AWS::Region' },
        ':',
        { Ref: 'AWS::AccountId' },
        ':table/',
        await constructCFModelTableNameComponent(appsyncResourceName, resourceName, appsyncTableSuffix),
    ];
}
exports.constructCFModelTableArnComponent = constructCFModelTableArnComponent;
async function constructCFModelTableNameComponent(appsyncResourceName, resourceName, appsyncTableSuffix) {
    const tableName = await mapModelNameToTableName(resourceName.replace(`:${appsyncTableSuffix}`, ''));
    return {
        'Fn::ImportValue': {
            'Fn::Sub': `\${api${appsyncResourceName}GraphQLAPIIdOutput}:GetAtt:${tableName}Table:Name`,
        },
    };
}
exports.constructCFModelTableNameComponent = constructCFModelTableNameComponent;
function constructCloudWatchEventComponent(cfnFilePath, cfnContent) {
    cfnContent.Resources.CloudWatchEvent = {
        Type: 'AWS::Events::Rule',
        Properties: {
            Description: 'Schedule rule for Lambda',
            ScheduleExpression: {
                Ref: 'CloudWatchRule',
            },
            State: 'ENABLED',
            Targets: [
                {
                    Arn: { 'Fn::GetAtt': ['LambdaFunction', 'Arn'] },
                    Id: {
                        Ref: 'LambdaFunction',
                    },
                },
            ],
        },
    };
    cfnContent.Resources.PermissionForEventsToInvokeLambda = {
        Type: 'AWS::Lambda::Permission',
        Properties: {
            FunctionName: {
                Ref: 'LambdaFunction',
            },
            Action: 'lambda:InvokeFunction',
            Principal: 'events.amazonaws.com',
            SourceArn: { 'Fn::GetAtt': ['CloudWatchEvent', 'Arn'] },
        },
    };
    cfnContent.Outputs.CloudWatchEventRule = {
        Value: {
            Ref: 'CloudWatchEvent',
        },
    };
    if (cfnContent.Parameters.CloudWatchRule === undefined) {
        cfnContent.Parameters.CloudWatchRule = {
            Type: 'String',
            Default: 'NONE',
            Description: ' Schedule Expression',
        };
    }
}
exports.constructCloudWatchEventComponent = constructCloudWatchEventComponent;
function apiResourceAddCheck(currentResources, newResources, apiResourceName, resourceSet, isEnvParams) {
    const apiAddFlag = resourceSet.has('api') || !newResources.find((resource) => resource.includes('storage'));
    if (apiAddFlag) {
        isEnvParams ? currentResources.push(`API_${apiResourceName.toUpperCase()}_`) : currentResources.push(`api${apiResourceName}`);
    }
}
async function mapModelNameToTableName(modelName) {
    const appSyncResourceName = (0, appSyncHelper_1.getAppSyncResourceName)();
    const resourceDirPath = path.join(amplify_cli_core_1.pathManager.getBackendDirPath(), 'api', appSyncResourceName);
    const project = await (0, graphql_transformer_core_1.readProjectConfiguration)(resourceDirPath);
    return (0, graphql_transformer_core_1.getTableNameForModel)(project.schema, modelName);
}
//# sourceMappingURL=cloudformationHelpers.js.map