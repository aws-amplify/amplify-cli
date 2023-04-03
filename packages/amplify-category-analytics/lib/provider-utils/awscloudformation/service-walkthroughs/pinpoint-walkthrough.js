"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIAMPolicies = exports.migrate = exports.writeParams = exports.addWalkthrough = void 0;
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const os_1 = __importDefault(require("os"));
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const pinpoint_helper_1 = require("../../../utils/pinpoint-helper");
const category = amplify_cli_core_1.AmplifyCategories.ANALYTICS;
const parametersFileName = 'parameters.json';
const serviceName = 'Pinpoint';
const templateFileName = 'pinpoint-cloudformation-template.json';
const addWalkthrough = async (context, defaultValuesFilename, serviceMetadata) => {
    const resourceName = resourceAlreadyExists(context);
    if (resourceName) {
        const errMessage = 'Pinpoint analytics have already been added to your project.';
        amplify_prompts_1.printer.warn(errMessage);
        await context.usageData.emitError(new amplify_cli_core_1.ResourceAlreadyExistsError(errMessage));
        (0, amplify_cli_core_1.exitOnNextTick)(0);
    }
    else {
        return configure(context, defaultValuesFilename);
    }
    return undefined;
};
exports.addWalkthrough = addWalkthrough;
const configure = async (context, defaultValuesFilename) => {
    const { amplify } = context;
    const defaultValuesSrc = `${__dirname}/../default-values/${defaultValuesFilename}`;
    const { getAllDefaults } = require(defaultValuesSrc);
    const defaultValues = getAllDefaults(amplify.getProjectDetails());
    const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();
    const pinpointApp = (0, pinpoint_helper_1.getNotificationsCategoryHasPinpointIfExists)();
    if (pinpointApp) {
        Object.assign(defaultValues, pinpointApp);
    }
    const resource = await amplify_prompts_1.prompter.input('Provide your pinpoint resource name:', {
        validate: (0, amplify_prompts_1.alphanumeric)('Resource name must be alphanumeric'),
        initial: defaultValues.appName,
    });
    defaultValues.appName = resource;
    defaultValues.resourceName = resource;
    const analyticsRequirements = {
        authSelections: 'identityPoolOnly',
        allowUnauthenticatedIdentities: true,
    };
    const checkResult = await context.amplify.invokePluginMethod(context, 'auth', undefined, 'checkRequirements', [
        analyticsRequirements,
        context,
        'analytics',
        resource,
    ]);
    if (checkResult.authImported === true && checkResult.errors && checkResult.errors.length > 0) {
        throw new Error(checkResult.errors.join(os_1.default.EOL));
    }
    if (checkResult.errors && checkResult.errors.length > 0) {
        amplify_prompts_1.printer.warn(checkResult.errors.join(os_1.default.EOL));
    }
    if (!checkResult.authEnabled || !checkResult.requirementsMet) {
        amplify_prompts_1.printer.warn('Adding analytics would add the Auth category to the project if not already added.');
        if (await amplify.confirmPrompt('Apps need authorization to send analytics events. Do you want to allow guests and unauthenticated users to send analytics events? (we recommend you allow this when getting started)')) {
            try {
                await context.amplify.invokePluginMethod(context, 'auth', undefined, 'externalAuthEnable', [
                    context,
                    'analytics',
                    resource,
                    analyticsRequirements,
                ]);
            }
            catch (error) {
                amplify_prompts_1.printer.error(error);
                throw error;
            }
        }
        else {
            try {
                amplify_prompts_1.printer.warn('Authorize only authenticated users to send analytics events. Use "amplify update auth" to modify this behavior.');
                analyticsRequirements.allowUnauthenticatedIdentities = false;
                await context.amplify.invokePluginMethod(context, 'auth', undefined, 'externalAuthEnable', [
                    context,
                    'analytics',
                    resource,
                    analyticsRequirements,
                ]);
            }
            catch (error) {
                amplify_prompts_1.printer.error(error);
                throw error;
            }
        }
    }
    const resourceDirPath = path_1.default.join(projectBackendDirPath, category, resource);
    delete defaultValues.resourceName;
    (0, exports.writeParams)(resourceDirPath, defaultValues);
    await writeCfnFile(context, resourceDirPath);
    return resource;
};
const resourceAlreadyExists = (context) => {
    const { amplify } = context;
    const { amplifyMeta } = amplify.getProjectDetails();
    let resourceName;
    if (amplifyMeta[category]) {
        const categoryResources = amplifyMeta[category];
        Object.keys(categoryResources).forEach((resource) => {
            if (categoryResources[resource].service === serviceName) {
                resourceName = resource;
            }
        });
    }
    return resourceName;
};
const writeCfnFile = async (context, resourceDirPath, force = false) => {
    fs_extra_1.default.ensureDirSync(resourceDirPath);
    const templateFilePath = path_1.default.join(resourceDirPath, templateFileName);
    if (!fs_extra_1.default.existsSync(templateFilePath) || force) {
        const templateSourceFilePath = path_1.default.join(__dirname, '..', 'cloudformation-templates', templateFileName);
        const templateSource = context.amplify.readJsonFile(templateSourceFilePath);
        templateSource.Mappings = await (0, pinpoint_helper_1.getPinpointRegionMappings)(context);
        amplify_cli_core_1.JSONUtilities.writeJson(templateFilePath, templateSource);
    }
};
const writeParams = (resourceDirPath, values) => {
    fs_extra_1.default.ensureDirSync(resourceDirPath);
    const parametersFilePath = path_1.default.join(resourceDirPath, parametersFileName);
    const jsonString = JSON.stringify(values, null, 4);
    fs_extra_1.default.writeFileSync(parametersFilePath, jsonString, 'utf8');
};
exports.writeParams = writeParams;
const migrate = (context) => {
    const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();
    const { amplifyMeta } = context.migrationInfo;
    const { analytics = {} } = amplifyMeta;
    Object.keys(analytics).forEach((resourceName) => {
        const resourcePath = path_1.default.join(projectBackendDirPath, category, resourceName);
        const cfn = context.amplify.readJsonFile(path_1.default.join(resourcePath, 'pinpoint-cloudformation-template.json'));
        const updatedCfn = migrateCFN(cfn);
        fs_extra_1.default.ensureDirSync(resourcePath);
        const templateFilePath = path_1.default.join(resourcePath, templateFileName);
        fs_extra_1.default.writeFileSync(templateFilePath, JSON.stringify(updatedCfn, null, 4), 'utf8');
        const parameters = context.amplify.readJsonFile(path_1.default.join(resourcePath, 'parameters.json'));
        const updatedParams = migrateParams(context, parameters);
        const parametersFilePath = path_1.default.join(resourcePath, parametersFileName);
        fs_extra_1.default.writeFileSync(parametersFilePath, JSON.stringify(updatedParams, null, 4), 'utf8');
    });
};
exports.migrate = migrate;
const migrateCFN = (cfn) => {
    const { Parameters, Conditions, Resources } = cfn;
    delete Parameters.IAMPrefix;
    Parameters.authRoleArn = {
        Type: 'String',
    };
    Parameters.env = {
        Type: 'String',
    };
    delete Parameters.IAMPrefix;
    Conditions.ShouldNotCreateEnvResources = {
        'Fn::Equals': [
            {
                Ref: 'env',
            },
            'NONE',
        ],
    };
    const oldRoleName = Resources.LambdaExecutionRole.Properties.RoleName;
    const newRoleName = {
        'Fn::If': [
            'ShouldNotCreateEnvResources',
            oldRoleName,
            {
                'Fn::Join': [
                    '',
                    [
                        oldRoleName,
                        '-',
                        {
                            Ref: 'env',
                        },
                    ],
                ],
            },
        ],
    };
    Resources.LambdaExecutionRole.Properties.RoleName = newRoleName;
    const oldAppName = Resources.PinpointFunctionOutputs.Properties.appName;
    const newAppName = {
        'Fn::If': [
            'ShouldNotCreateEnvResources',
            oldAppName,
            {
                'Fn::Join': [
                    '',
                    [
                        oldAppName,
                        '-',
                        {
                            Ref: 'env',
                        },
                    ],
                ],
            },
        ],
    };
    Resources.PinpointFunctionOutputs.Properties.appName = newAppName;
    replaceRef(Resources, 'IAMPrefix', {
        'Fn::Select': ['4', { 'Fn::Split': [':', { Ref: 'authRoleArn' }] }],
    });
    return cfn;
};
const migrateParams = (context, params) => {
    const { defaultValuesFilename } = require(`${__dirname}/../../supported-services.json`)[serviceName];
    const defaultValuesSrc = `${__dirname}/../default-values/${defaultValuesFilename}`;
    const { getAllDefaults } = require(defaultValuesSrc);
    delete params.IAMPrefix;
    delete params.authRoleName;
    delete params.unauthRoleName;
    delete params.authRoleArn;
    const defaultValues = getAllDefaults(context.migrationInfo);
    delete defaultValues.resourceName;
    return { ...defaultValues, ...params };
};
const replaceRef = (node, refName, refReplacement) => {
    if (Array.isArray(node)) {
        return node.forEach((item) => replaceRef(item, refName, refReplacement));
    }
    if (typeof node === 'object') {
        if (isRefNode(node, refName)) {
            delete node.Ref;
            Object.assign(node, refReplacement);
            return undefined;
        }
        Object.values(node).forEach((n) => {
            replaceRef(n, refName, refReplacement);
        });
    }
    return undefined;
};
const isRefNode = (node, refName) => {
    if (typeof node === 'object' && 'Ref' in node && node.Ref === refName) {
        return true;
    }
    return false;
};
const getIAMPolicies = (resourceName, crudOptions) => {
    let policy = {};
    const actions = [];
    crudOptions.forEach((crudOption) => {
        switch (crudOption) {
            case 'create':
                actions.push('mobiletargeting:Put*', 'mobiletargeting:Create*', 'mobiletargeting:Send*');
                break;
            case 'update':
                actions.push('mobiletargeting:Update*');
                break;
            case 'read':
                actions.push('mobiletargeting:Get*', 'mobiletargeting:List*');
                break;
            case 'delete':
                actions.push('mobiletargeting:Delete*');
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
                        'arn:aws:mobiletargeting:',
                        {
                            Ref: `${category}${resourceName}Region`,
                        },
                        ':',
                        { Ref: 'AWS::AccountId' },
                        ':apps/',
                        {
                            Ref: `${category}${resourceName}Id`,
                        },
                    ],
                ],
            },
            {
                'Fn::Join': [
                    '',
                    [
                        'arn:aws:mobiletargeting:',
                        {
                            Ref: `${category}${resourceName}Region`,
                        },
                        ':',
                        { Ref: 'AWS::AccountId' },
                        ':apps/',
                        {
                            Ref: `${category}${resourceName}Id`,
                        },
                        '/*',
                    ],
                ],
            },
        ],
    };
    const attributes = ['Id', 'Region'];
    return { policy, attributes };
};
exports.getIAMPolicies = getIAMPolicies;
//# sourceMappingURL=pinpoint-walkthrough.js.map