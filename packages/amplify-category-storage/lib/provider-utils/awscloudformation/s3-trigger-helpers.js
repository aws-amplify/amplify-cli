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
exports.addTrigger = exports.removeTrigger = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const path = __importStar(require("path"));
const uuid_1 = require("uuid");
const constants_1 = require("../../constants");
const provider_constants_1 = require("./provider-constants");
async function removeTrigger(context, resourceName, triggerFunctionName) {
    const projectRoot = amplify_cli_core_1.pathManager.findProjectRoot();
    const resourceDirPath = amplify_cli_core_1.pathManager.getResourceDirectoryPath(projectRoot, constants_1.categoryName, resourceName);
    const storageCFNFilePath = path.join(resourceDirPath, 's3-cloudformation-template.json');
    const { cfnTemplate: storageCFNFile } = (0, amplify_cli_core_1.readCFNTemplate)(storageCFNFilePath);
    const bucketParameters = amplify_cli_core_1.stateManager.getResourceParametersJson(projectRoot, constants_1.categoryName, resourceName);
    const adminTrigger = bucketParameters.adminTriggerFunction;
    delete storageCFNFile.Parameters[`function${triggerFunctionName}Arn`];
    delete storageCFNFile.Parameters[`function${triggerFunctionName}Name`];
    delete storageCFNFile.Parameters[`function${triggerFunctionName}LambdaExecutionRole`];
    delete storageCFNFile.Resources.TriggerPermissions;
    if (!adminTrigger) {
        delete storageCFNFile.Resources.S3Bucket.Properties.NotificationConfiguration;
        delete storageCFNFile.Resources.S3TriggerBucketPolicy;
        delete storageCFNFile.Resources.S3Bucket.DependsOn;
    }
    else {
        const lambdaConfigurations = [];
        storageCFNFile.Resources.S3Bucket.Properties.NotificationConfiguration.LambdaConfigurations.forEach((triggers) => {
            if (triggers.Filter &&
                typeof triggers.Filter.S3Key.Rules[0].Value === 'string' &&
                triggers.Filter.S3Key.Rules[0].Value.includes('index-faces')) {
                lambdaConfigurations.push(triggers);
            }
        });
        storageCFNFile.Resources.S3Bucket.Properties.NotificationConfiguration.LambdaConfigurations = lambdaConfigurations;
        const index = storageCFNFile.Resources.S3Bucket.DependsOn.indexOf('TriggerPermissions');
        if (index > -1) {
            storageCFNFile.Resources.S3Bucket.DependsOn.splice(index, 1);
        }
        const roles = [];
        storageCFNFile.Resources.S3TriggerBucketPolicy.Properties.Roles.forEach((role) => {
            if (!role.Ref.includes(triggerFunctionName)) {
                roles.push(role);
            }
        });
        storageCFNFile.Resources.S3TriggerBucketPolicy.Properties.Roles = roles;
    }
    await (0, amplify_cli_core_1.writeCFNTemplate)(storageCFNFile, storageCFNFilePath);
    const meta = amplify_cli_core_1.stateManager.getMeta(projectRoot);
    const s3DependsOnResources = meta.storage[resourceName].dependsOn;
    const s3Resources = [];
    s3DependsOnResources.forEach((resource) => {
        if (resource.resourceName !== triggerFunctionName) {
            s3Resources.push(resource);
        }
    });
    context.amplify.updateamplifyMetaAfterResourceUpdate(constants_1.categoryName, resourceName, 'dependsOn', s3Resources);
}
exports.removeTrigger = removeTrigger;
async function addTrigger(context, resourceName, triggerFunction, adminTriggerFunction, options) {
    const triggerTypeChoices = ['Choose an existing function from the project', 'Create a new function'];
    const [shortId] = (0, uuid_1.v4)().split('-');
    let functionName = `S3Trigger${shortId}`;
    let useExistingFunction;
    if (options === null || options === void 0 ? void 0 : options.headlessTrigger) {
        functionName = options.headlessTrigger.name;
        useExistingFunction = options.headlessTrigger.mode === 'existing';
    }
    else {
        const triggerTypeQuestion = {
            message: 'Select from the following options',
            choices: triggerTypeChoices,
        };
        useExistingFunction = (await amplify_prompts_1.prompter.pick(triggerTypeQuestion.message, triggerTypeQuestion.choices)) === triggerTypeChoices[0];
        if (useExistingFunction) {
            let lambdaResources = await getLambdaFunctions(context);
            if (triggerFunction) {
                lambdaResources = lambdaResources.filter((lambdaResource) => lambdaResource !== triggerFunction);
            }
            if (lambdaResources.length === 0) {
                throw new Error("No functions were found in the project. Use 'amplify add function' to add a new function.");
            }
            const triggerOptionQuestion = {
                message: 'Select from the following options',
                choices: lambdaResources,
            };
            functionName = await amplify_prompts_1.prompter.pick(triggerOptionQuestion.message, triggerOptionQuestion.choices);
        }
    }
    const functionCFNFilePath = path.join(amplify_cli_core_1.pathManager.getResourceDirectoryPath(undefined, constants_1.functionCategoryName, functionName), `${functionName}-cloudformation-template.json`);
    if (useExistingFunction) {
        const { cfnTemplate: functionCFNFile } = (0, amplify_cli_core_1.readCFNTemplate)(functionCFNFilePath);
        functionCFNFile.Outputs.LambdaExecutionRole = {
            Value: {
                Ref: 'LambdaExecutionRole',
            },
        };
        await (0, amplify_cli_core_1.writeCFNTemplate)(functionCFNFile, functionCFNFilePath);
        amplify_prompts_1.printer.success(`Successfully updated resource ${functionName} locally`);
    }
    else {
        const targetDir = amplify_cli_core_1.pathManager.getBackendDirPath();
        const pluginDir = __dirname;
        const defaults = {
            functionName,
            roleName: `${functionName}LambdaRole${shortId}`,
        };
        const copyJobs = [
            {
                dir: pluginDir,
                template: path.join('..', '..', '..', 'resources', 'triggers', 's3', 'lambda-cloudformation-template.json.ejs'),
                target: path.join(targetDir, constants_1.functionCategoryName, functionName, `${functionName}-cloudformation-template.json`),
            },
            {
                dir: pluginDir,
                template: path.join('..', '..', '..', 'resources', 'triggers', 's3', 'event.json'),
                target: path.join(targetDir, constants_1.functionCategoryName, functionName, 'src', 'event.json'),
            },
            {
                dir: pluginDir,
                template: path.join('..', '..', '..', 'resources', 'triggers', 's3', 'index.js'),
                target: path.join(targetDir, constants_1.functionCategoryName, functionName, 'src', 'index.js'),
            },
            {
                dir: pluginDir,
                template: path.join('..', '..', '..', 'resources', 'triggers', 's3', 'package.json.ejs'),
                target: path.join(targetDir, constants_1.functionCategoryName, functionName, 'src', 'package.json'),
            },
        ];
        await context.amplify.copyBatch(context, copyJobs, defaults, !!(options === null || options === void 0 ? void 0 : options.headlessTrigger));
        const backendConfigs = {
            service: provider_constants_1.FunctionServiceNameLambdaFunction,
            providerPlugin: provider_constants_1.providerName,
            build: true,
        };
        await context.amplify.updateamplifyMetaAfterResourceAdd(constants_1.functionCategoryName, functionName, backendConfigs);
        amplify_prompts_1.printer.success(`Successfully added resource ${functionName} locally`);
        if (!(options === null || options === void 0 ? void 0 : options.headlessTrigger) &&
            (await context.amplify.confirmPrompt(`Do you want to edit the local ${functionName} lambda function now?`))) {
            await context.amplify.openEditor(context, path.join(targetDir, constants_1.functionCategoryName, functionName, 'src', 'index.js'));
        }
    }
    if (resourceName) {
        const projectBackendDirPath = amplify_cli_core_1.pathManager.getBackendDirPath();
        const storageCFNFilePath = path.join(projectBackendDirPath, constants_1.categoryName, resourceName, 's3-cloudformation-template.json');
        const { cfnTemplate: storageCFNFile } = (0, amplify_cli_core_1.readCFNTemplate)(storageCFNFilePath);
        const amplifyMetaFile = amplify_cli_core_1.stateManager.getMeta();
        if (triggerFunction) {
            delete storageCFNFile.Parameters[`function${triggerFunction}Arn`];
            delete storageCFNFile.Parameters[`function${triggerFunction}Name`];
            delete storageCFNFile.Parameters[`function${triggerFunction}LambdaExecutionRole`];
        }
        storageCFNFile.Parameters[`function${functionName}Arn`] = {
            Type: 'String',
            Default: `function${functionName}Arn`,
        };
        storageCFNFile.Parameters[`function${functionName}Name`] = {
            Type: 'String',
            Default: `function${functionName}Name`,
        };
        storageCFNFile.Parameters[`function${functionName}LambdaExecutionRole`] = {
            Type: 'String',
            Default: `function${functionName}LambdaExecutionRole`,
        };
        storageCFNFile.Parameters.triggerFunction = {
            Type: 'String',
        };
        if (adminTriggerFunction && !triggerFunction) {
            storageCFNFile.Resources.S3Bucket.DependsOn.push('TriggerPermissions');
            storageCFNFile.Resources.S3TriggerBucketPolicy.Properties.Roles.push({
                Ref: `function${functionName}LambdaExecutionRole`,
            });
            let lambdaConf = storageCFNFile.Resources.S3Bucket.Properties.NotificationConfiguration.LambdaConfigurations;
            lambdaConf = lambdaConf.concat(getTriggersForLambdaConfiguration('private', functionName), getTriggersForLambdaConfiguration('protected', functionName), getTriggersForLambdaConfiguration('public', functionName));
            storageCFNFile.Resources.S3Bucket.Properties.NotificationConfiguration.LambdaConfigurations = lambdaConf;
            const dependsOnResources = amplifyMetaFile.storage[resourceName].dependsOn;
            dependsOnResources.push({
                category: constants_1.functionCategoryName,
                resourceName: functionName,
                attributes: ['Name', 'Arn', 'LambdaExecutionRole'],
            });
            context.amplify.updateamplifyMetaAfterResourceUpdate(constants_1.categoryName, resourceName, 'dependsOn', dependsOnResources);
        }
        else if (adminTriggerFunction && triggerFunction !== 'NONE') {
            storageCFNFile.Resources.S3TriggerBucketPolicy.Properties.Roles.forEach((role) => {
                if (role.Ref.includes(triggerFunction)) {
                    role.Ref = `function${functionName}LambdaExecutionRole`;
                }
            });
            storageCFNFile.Resources.TriggerPermissions.Properties.FunctionName.Ref = `function${functionName}Name`;
            storageCFNFile.Resources.S3Bucket.Properties.NotificationConfiguration.LambdaConfigurations.forEach((lambdaConf) => {
                if (!(typeof lambdaConf.Filter.S3Key.Rules[0].Value === 'string' && lambdaConf.Filter.S3Key.Rules[0].Value.includes('index-faces'))) {
                    lambdaConf.Function.Ref = `function${functionName}Arn`;
                }
            });
            const dependsOnResources = amplifyMetaFile.storage[resourceName].dependsOn;
            dependsOnResources.forEach((resource) => {
                if (resource.resourceName === triggerFunction) {
                    resource.resourceName = functionName;
                }
            });
            context.amplify.updateamplifyMetaAfterResourceUpdate(constants_1.categoryName, resourceName, 'dependsOn', dependsOnResources);
        }
        else {
            storageCFNFile.Resources.S3Bucket.Properties.NotificationConfiguration = {
                LambdaConfigurations: [
                    {
                        Event: 's3:ObjectCreated:*',
                        Function: {
                            Ref: `function${functionName}Arn`,
                        },
                    },
                    {
                        Event: 's3:ObjectRemoved:*',
                        Function: {
                            Ref: `function${functionName}Arn`,
                        },
                    },
                ],
            };
            storageCFNFile.Resources.S3Bucket.DependsOn = ['TriggerPermissions'];
            storageCFNFile.Resources.S3TriggerBucketPolicy = {
                Type: 'AWS::IAM::Policy',
                DependsOn: ['S3Bucket'],
                Properties: {
                    PolicyName: 's3-trigger-lambda-execution-policy',
                    Roles: [
                        {
                            Ref: `function${functionName}LambdaExecutionRole`,
                        },
                    ],
                    PolicyDocument: {
                        Version: '2012-10-17',
                        Statement: [
                            {
                                Effect: 'Allow',
                                Action: ['s3:PutObject', 's3:GetObject', 's3:DeleteObject'],
                                Resource: [
                                    {
                                        'Fn::Join': [
                                            '',
                                            [
                                                'arn:aws:s3:::',
                                                {
                                                    Ref: 'S3Bucket',
                                                },
                                                '/*',
                                            ],
                                        ],
                                    },
                                ],
                            },
                            {
                                Effect: 'Allow',
                                Action: 's3:ListBucket',
                                Resource: [
                                    {
                                        'Fn::Join': [
                                            '',
                                            [
                                                'arn:aws:s3:::',
                                                {
                                                    Ref: 'S3Bucket',
                                                },
                                            ],
                                        ],
                                    },
                                ],
                            },
                        ],
                    },
                },
            };
            const dependsOnResources = options.dependsOn || amplifyMetaFile.storage[resourceName].dependsOn || [];
            dependsOnResources.filter((resource) => resource.resourceName !== triggerFunction);
            dependsOnResources.push({
                category: constants_1.functionCategoryName,
                resourceName: functionName,
                attributes: ['Name', 'Arn', 'LambdaExecutionRole'],
            });
            context.amplify.updateamplifyMetaAfterResourceUpdate(constants_1.categoryName, resourceName, 'dependsOn', dependsOnResources);
        }
        storageCFNFile.Resources.TriggerPermissions = {
            Type: 'AWS::Lambda::Permission',
            Properties: {
                Action: 'lambda:InvokeFunction',
                FunctionName: {
                    Ref: `function${functionName}Name`,
                },
                Principal: 's3.amazonaws.com',
                SourceAccount: {
                    Ref: 'AWS::AccountId',
                },
                SourceArn: {
                    'Fn::Join': [
                        '',
                        [
                            'arn:aws:s3:::',
                            {
                                'Fn::If': [
                                    'ShouldNotCreateEnvResources',
                                    {
                                        Ref: 'bucketName',
                                    },
                                    {
                                        'Fn::Join': [
                                            '',
                                            [
                                                {
                                                    Ref: 'bucketName',
                                                },
                                                {
                                                    'Fn::Select': [
                                                        3,
                                                        {
                                                            'Fn::Split': [
                                                                '-',
                                                                {
                                                                    Ref: 'AWS::StackName',
                                                                },
                                                            ],
                                                        },
                                                    ],
                                                },
                                                '-',
                                                {
                                                    Ref: 'env',
                                                },
                                            ],
                                        ],
                                    },
                                ],
                            },
                        ],
                    ],
                },
            },
        };
        await (0, amplify_cli_core_1.writeCFNTemplate)(storageCFNFile, storageCFNFilePath);
    }
    else {
        if (!options.dependsOn) {
            options.dependsOn = [];
        }
        options.dependsOn.push({
            category: constants_1.functionCategoryName,
            resourceName: functionName,
            attributes: ['Name', 'Arn', 'LambdaExecutionRole'],
        });
    }
    return functionName;
}
exports.addTrigger = addTrigger;
function getTriggersForLambdaConfiguration(protectionLevel, functionName) {
    const triggers = [
        {
            Event: 's3:ObjectCreated:*',
            Filter: {
                S3Key: {
                    Rules: [
                        {
                            Name: 'prefix',
                            Value: {
                                'Fn::Join': [
                                    '',
                                    [
                                        `${protectionLevel}/`,
                                        {
                                            Ref: 'AWS::Region',
                                        },
                                    ],
                                ],
                            },
                        },
                    ],
                },
            },
            Function: {
                Ref: `function${functionName}Arn`,
            },
        },
        {
            Event: 's3:ObjectRemoved:*',
            Filter: {
                S3Key: {
                    Rules: [
                        {
                            Name: 'prefix',
                            Value: {
                                'Fn::Join': [
                                    '',
                                    [
                                        `${protectionLevel}/`,
                                        {
                                            Ref: 'AWS::Region',
                                        },
                                    ],
                                ],
                            },
                        },
                    ],
                },
            },
            Function: {
                Ref: `function${functionName}Arn`,
            },
        },
    ];
    return triggers;
}
async function getLambdaFunctions(context) {
    const { allResources } = await context.amplify.getResourceStatus();
    const lambdaResources = allResources
        .filter((resource) => resource.service === provider_constants_1.FunctionServiceNameLambdaFunction)
        .map((resource) => resource.resourceName);
    return lambdaResources;
}
//# sourceMappingURL=s3-trigger-helpers.js.map