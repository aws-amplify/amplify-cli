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
exports.createAdminAuthFunction = exports.updateUserPoolGroups = exports.createUserPoolGroups = exports.removeDeprecatedProps = exports.saveResourceParameters = exports.copyCfnTemplate = exports.getResourceUpdater = exports.getResourceSynthesizer = void 0;
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const fs_extra_1 = require("fs-extra");
const lodash_1 = require("lodash");
const path = __importStar(require("path"));
const uuid_1 = require("uuid");
const constants_1 = require("../constants");
const generate_user_pool_group_stack_template_1 = require("./generate-user-pool-group-stack-template");
const getResourceSynthesizer = async (context, request) => {
    await lambdaTriggers(request, context, null);
    await addAdminAuth(context, request.resourceName, 'add', request.adminQueryGroup);
    await copyS3Assets(request);
    return request;
};
exports.getResourceSynthesizer = getResourceSynthesizer;
const getResourceUpdater = async (context, request) => {
    var _a;
    const resources = context.amplify.getProjectMeta();
    const adminQueriesFunctionName = (0, lodash_1.get)(resources, ['api', 'AdminQueries', 'dependsOn'], [])
        .filter((resource) => resource.category === amplify_cli_core_1.AmplifyCategories.FUNCTION)
        .map((resource) => resource.resourceName)
        .find((resourceName) => resourceName.includes('AdminQueries'));
    if (adminQueriesFunctionName) {
        await addAdminAuth(context, request.resourceName, 'update', request.adminQueryGroup, adminQueriesFunctionName);
    }
    else {
        await addAdminAuth(context, request.resourceName, 'add', request.adminQueryGroup);
    }
    const providerPlugin = context.amplify.getPluginInstance(context, 'awscloudformation');
    const previouslySaved = JSON.parse(((_a = providerPlugin.loadResourceParameters(context, 'auth', request.resourceName)) === null || _a === void 0 ? void 0 : _a.triggers) || '{}');
    await lambdaTriggers(request, context, previouslySaved);
    await copyS3Assets(request);
    return request;
};
exports.getResourceUpdater = getResourceUpdater;
const copyCfnTemplate = async (context, category, options, cfnFilename) => {
    const targetDir = path.join(amplify_cli_core_1.pathManager.getBackendDirPath(), category, options.resourceName);
    const copyJobs = [
        {
            dir: constants_1.cfnTemplateRoot,
            template: cfnFilename,
            target: path.join(targetDir, `${options.resourceName}-cloudformation-template.yml`),
            paramsFile: path.join(targetDir, 'parameters.json'),
        },
    ];
    const privateParams = { ...options };
    constants_1.privateKeys.forEach((p) => delete privateParams[p]);
    return context.amplify.copyBatch(context, copyJobs, privateParams, true);
};
exports.copyCfnTemplate = copyCfnTemplate;
const saveResourceParameters = (context, providerName, category, resource, params, envSpecificParams = []) => {
    const provider = context.amplify.getPluginInstance(context, providerName);
    let privateParams = { ...params };
    constants_1.privateKeys.forEach((p) => delete privateParams[p]);
    privateParams = (0, exports.removeDeprecatedProps)(privateParams);
    provider.saveResourceParameters(context, category, resource, privateParams, envSpecificParams);
};
exports.saveResourceParameters = saveResourceParameters;
const removeDeprecatedProps = (props) => {
    [
        'authRoleName',
        'unauthRoleName',
        'userpoolClientName',
        'roleName',
        'policyName',
        'mfaLambdaLogPolicy',
        'mfaPassRolePolicy',
        'mfaLambdaIAMPolicy',
        'userpoolClientLogPolicy',
        'userpoolClientLambdaPolicy',
        'lambdaLogPolicy',
        'openIdRolePolicy',
        'openIdLambdaIAMPolicy',
        'mfaLambdaRole',
        'openIdLambdaRoleName',
        'CreateAuthChallenge',
        'CustomMessage',
        'DefineAuthChallenge',
        'PostAuthentication',
        'PostConfirmation',
        'PreAuthentication',
        'PreSignup',
        'VerifyAuthChallengeResponse',
    ].forEach((deprecatedField) => delete props[deprecatedField]);
    return props;
};
exports.removeDeprecatedProps = removeDeprecatedProps;
const lambdaTriggers = async (coreAnswers, context, previouslySaved) => {
    const { handleTriggers } = await Promise.resolve().then(() => __importStar(require('./trigger-flow-auth-helper')));
    let triggerKeyValues = {};
    let authTriggerConnections;
    if (coreAnswers.triggers) {
        const triggerConfig = (await handleTriggers(context, coreAnswers, previouslySaved));
        triggerKeyValues = triggerConfig.triggers;
        authTriggerConnections = triggerConfig.authTriggerConnections;
        coreAnswers.triggers = triggerKeyValues ? amplify_cli_core_1.JSONUtilities.stringify(triggerKeyValues) : '{}';
        if (amplify_cli_core_1.FeatureFlags.getBoolean('auth.breakCircularDependency')) {
            if (Array.isArray(authTriggerConnections) && authTriggerConnections.length > 0) {
                coreAnswers.authTriggerConnections = amplify_cli_core_1.JSONUtilities.stringify(authTriggerConnections);
            }
            else {
                delete coreAnswers.authTriggerConnections;
            }
        }
        coreAnswers.breakCircularDependency = amplify_cli_core_1.FeatureFlags.getBoolean('auth.breakCircularDependency');
        if (triggerKeyValues) {
            coreAnswers.parentStack = { Ref: 'AWS::StackId' };
        }
        coreAnswers.permissions = await context.amplify.getTriggerPermissions(context, coreAnswers.triggers, amplify_cli_core_1.AmplifyCategories.AUTH, coreAnswers.resourceName);
    }
    else if (previouslySaved) {
        const targetDir = amplify_cli_core_1.pathManager.getBackendDirPath();
        Object.keys(previouslySaved).forEach((p) => {
            delete coreAnswers[p];
        });
        await context.amplify.deleteAllTriggers(previouslySaved, coreAnswers.resourceName, targetDir, context);
    }
    if (coreAnswers.triggers && coreAnswers.triggers === '[]') {
        delete coreAnswers.triggers;
    }
    const dependsOnKeys = Object.keys(triggerKeyValues).map((i) => `${coreAnswers.resourceName}${i}`);
    coreAnswers.dependsOn = context.amplify.dependsOnBlock(context, dependsOnKeys, 'Cognito');
};
const createUserPoolGroups = async (context, resourceName, userPoolGroupList) => {
    if (userPoolGroupList && userPoolGroupList.length > 0) {
        const userPoolGroupPrecedenceList = [];
        for (let i = 0; i < userPoolGroupList.length; ++i) {
            userPoolGroupPrecedenceList.push({
                groupName: userPoolGroupList[i],
                precedence: i + 1,
            });
        }
        const userPoolGroupFile = path.join(amplify_cli_core_1.pathManager.getBackendDirPath(), amplify_cli_core_1.AmplifyCategories.AUTH, 'userPoolGroups', 'user-pool-group-precedence.json');
        const userPoolGroupParams = path.join(amplify_cli_core_1.pathManager.getBackendDirPath(), amplify_cli_core_1.AmplifyCategories.AUTH, 'userPoolGroups', 'build', 'parameters.json');
        const groupParams = {
            AuthRoleArn: {
                'Fn::GetAtt': ['AuthRole', 'Arn'],
            },
            UnauthRoleArn: {
                'Fn::GetAtt': ['UnauthRole', 'Arn'],
            },
        };
        amplify_cli_core_1.JSONUtilities.writeJson(userPoolGroupParams, groupParams);
        amplify_cli_core_1.JSONUtilities.writeJson(userPoolGroupFile, userPoolGroupPrecedenceList);
        context.amplify.updateamplifyMetaAfterResourceAdd(amplify_cli_core_1.AmplifyCategories.AUTH, 'userPoolGroups', {
            service: 'Cognito-UserPool-Groups',
            providerPlugin: 'awscloudformation',
            dependsOn: [
                {
                    category: amplify_cli_core_1.AmplifyCategories.AUTH,
                    resourceName,
                    attributes: ['UserPoolId', 'AppClientIDWeb', 'AppClientID', 'IdentityPoolId'],
                },
            ],
        });
        await (0, generate_user_pool_group_stack_template_1.generateUserPoolGroupStackTemplate)(context, resourceName);
    }
};
exports.createUserPoolGroups = createUserPoolGroups;
const updateUserPoolGroups = async (context, resourceName, userPoolGroupList) => {
    var _a, _b;
    if (userPoolGroupList && userPoolGroupList.length > 0) {
        const userPoolGroupFolder = path.join(amplify_cli_core_1.pathManager.getBackendDirPath(), amplify_cli_core_1.AmplifyCategories.AUTH, 'userPoolGroups');
        const prevUserPoolGroupPrecedenceList = (_a = amplify_cli_core_1.JSONUtilities.readJson(path.join(userPoolGroupFolder, 'user-pool-group-precedence.json'), {
            throwIfNotExist: false,
        })) !== null && _a !== void 0 ? _a : [];
        const currentUserPoolGroupPrecedenceList = userPoolGroupList.map((groupName, index) => ({
            groupName,
            precedence: index + 1,
        }));
        const updatedUserPoolGroupList = [];
        currentUserPoolGroupPrecedenceList.forEach((group1) => {
            let newGroup = group1;
            prevUserPoolGroupPrecedenceList.forEach((group2) => {
                const oldGroup = group2;
                if (newGroup.groupName === oldGroup.groupName) {
                    newGroup = { ...oldGroup, ...newGroup };
                }
            });
            updatedUserPoolGroupList.push(newGroup);
        });
        (0, fs_extra_1.ensureDirSync)(userPoolGroupFolder);
        amplify_cli_core_1.JSONUtilities.writeJson(path.join(userPoolGroupFolder, 'user-pool-group-precedence.json'), updatedUserPoolGroupList);
        context.amplify.updateamplifyMetaAfterResourceUpdate(amplify_cli_core_1.AmplifyCategories.AUTH, 'userPoolGroups', 'service', 'Cognito-UserPool-Groups');
        context.amplify.updateamplifyMetaAfterResourceUpdate(amplify_cli_core_1.AmplifyCategories.AUTH, 'userPoolGroups', 'providerPlugin', 'awscloudformation');
        const authInputs = amplify_cli_core_1.stateManager.getResourceInputsJson(undefined, amplify_cli_core_1.AmplifyCategories.AUTH, resourceName);
        const attributes = ['UserPoolId', 'AppClientIDWeb', 'AppClientID'];
        if ((_b = authInputs === null || authInputs === void 0 ? void 0 : authInputs.cognitoConfig) === null || _b === void 0 ? void 0 : _b.identityPoolName) {
            attributes.push('IdentityPoolId');
        }
        context.amplify.updateamplifyMetaAfterResourceUpdate(amplify_cli_core_1.AmplifyCategories.AUTH, 'userPoolGroups', 'dependsOn', [
            {
                category: amplify_cli_core_1.AmplifyCategories.AUTH,
                resourceName,
                attributes,
            },
        ]);
        await (0, generate_user_pool_group_stack_template_1.generateUserPoolGroupStackTemplate)(context, resourceName);
    }
};
exports.updateUserPoolGroups = updateUserPoolGroups;
const addAdminAuth = async (context, authResourceName, operation, adminGroup, functionName) => {
    if (adminGroup) {
        if (!functionName) {
            const [shortId] = (0, uuid_1.v4)().split('-');
            functionName = `AdminQueries${shortId}`;
        }
        await (0, exports.createAdminAuthFunction)(context, authResourceName, functionName, adminGroup, operation);
        await createAdminAuthAPI(context, authResourceName, functionName, operation);
    }
};
const createAdminAuthFunction = async (context, authResourceName, functionName, adminGroup, operation) => {
    const targetDir = path.join(amplify_cli_core_1.pathManager.getBackendDirPath(), amplify_cli_core_1.AmplifyCategories.FUNCTION, functionName);
    let lambdaGroupVar = adminGroup;
    const dependsOn = [];
    dependsOn.push({
        category: amplify_cli_core_1.AmplifyCategories.AUTH,
        resourceName: authResourceName,
        attributes: ['UserPoolId'],
    });
    if (!lambdaGroupVar) {
        lambdaGroupVar = 'NONE';
    }
    if (operation === 'add') {
        const functionProps = {
            functionName: `${functionName}`,
            roleName: `${functionName}LambdaRole`,
            dependsOn,
            authResourceName,
            lambdaGroupVar,
        };
        const copyJobs = [
            {
                dir: constants_1.adminAuthAssetRoot,
                template: 'admin-auth-app.js',
                target: path.join(targetDir, 'src/app.js'),
            },
            {
                dir: constants_1.adminAuthAssetRoot,
                template: 'admin-auth-cognitoActions.js',
                target: path.join(targetDir, 'src/cognitoActions.js'),
            },
            {
                dir: constants_1.adminAuthAssetRoot,
                template: 'admin-auth-index.js',
                target: path.join(targetDir, 'src/index.js'),
            },
            {
                dir: constants_1.adminAuthAssetRoot,
                template: 'admin-auth-package.json',
                target: path.join(targetDir, 'src/package.json'),
            },
            {
                dir: constants_1.adminAuthAssetRoot,
                template: 'admin-queries-function-template.json.ejs',
                target: path.join(targetDir, `${functionName}-cloudformation-template.json`),
            },
        ];
        await context.amplify.copyBatch(context, copyJobs, functionProps, true);
        const backendConfigs = {
            service: amplify_cli_core_1.AmplifySupportedService.LAMBDA,
            providerPlugin: 'awscloudformation',
            build: true,
            dependsOn,
        };
        await context.amplify.updateamplifyMetaAfterResourceAdd(amplify_cli_core_1.AmplifyCategories.FUNCTION, functionName, backendConfigs);
        amplify_prompts_1.printer.success(`Successfully added ${functionName} function locally`);
    }
    else {
        amplify_prompts_1.printer.success(`Successfully updated ${functionName} function locally`);
    }
};
exports.createAdminAuthFunction = createAdminAuthFunction;
const createAdminAuthAPI = async (context, authResourceName, functionName, operation) => {
    const apiName = 'AdminQueries';
    const dependsOn = [
        {
            category: amplify_cli_core_1.AmplifyCategories.AUTH,
            resourceName: authResourceName,
            attributes: ['UserPoolId'],
        },
        {
            category: amplify_cli_core_1.AmplifyCategories.FUNCTION,
            resourceName: functionName,
            attributes: ['Arn', 'Name'],
        },
    ];
    const apiProps = {
        apiName,
        functionName,
        authResourceName,
        dependsOn,
    };
    if (operation === 'add') {
        await context.amplify.invokePluginMethod(context, amplify_cli_core_1.AmplifyCategories.API, undefined, 'addAdminQueriesApi', [context, apiProps]);
        amplify_prompts_1.printer.success(`Successfully added ${apiName} API locally`);
    }
    else {
        await context.amplify.invokePluginMethod(context, amplify_cli_core_1.AmplifyCategories.API, undefined, 'updateAdminQueriesApi', [context, apiProps]);
        amplify_prompts_1.printer.success(`Successfully updated ${apiName} API locally`);
    }
};
const copyS3Assets = async (request) => {
    const targetDir = path.join(amplify_cli_core_1.pathManager.getBackendDirPath(), amplify_cli_core_1.AmplifyCategories.AUTH, request.resourceName, 'assets');
    const triggers = request.triggers ? amplify_cli_core_1.JSONUtilities.parse(request.triggers) : null;
    const confirmationFileNeeded = request.triggers && triggers.CustomMessage && triggers.CustomMessage.includes('verification-link');
    if (confirmationFileNeeded) {
        if (!(0, fs_extra_1.existsSync)(targetDir)) {
            const source = path.join(constants_1.triggerRoot, 'CustomMessage/assets');
            (0, fs_extra_1.copySync)(source, targetDir);
        }
    }
};
//# sourceMappingURL=synthesize-resources.js.map