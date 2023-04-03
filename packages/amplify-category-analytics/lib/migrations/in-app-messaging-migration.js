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
exports.inAppMessagingMigrationCheck = void 0;
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const fs_extra_1 = __importDefault(require("fs-extra"));
const path = __importStar(require("path"));
const analytics_1 = require("../commands/analytics");
const plugin_client_api_auth_1 = require("../plugin-client-api-auth");
const pinpoint_defaults_1 = require("../provider-utils/awscloudformation/default-values/pinpoint-defaults");
const analytics_helper_1 = require("../utils/analytics-helper");
const pinpoint_helper_1 = require("../utils/pinpoint-helper");
const inAppMessagingMigrationCheck = async (context) => {
    var _a;
    const projectBackendDirPath = amplify_cli_core_1.pathManager.getBackendDirPath();
    const resources = (0, analytics_helper_1.getAnalyticsResources)(context);
    if (resources.length > 0 && !(0, pinpoint_helper_1.pinpointHasInAppMessagingPolicy)(context)) {
        const amplifyMeta = amplify_cli_core_1.stateManager.getMeta();
        const analytics = amplifyMeta[amplify_cli_core_1.AmplifyCategories.ANALYTICS] || {};
        Object.keys(analytics).forEach((resourceName) => {
            const analyticsResourcePath = path.join(projectBackendDirPath, amplify_cli_core_1.AmplifyCategories.ANALYTICS, resourceName);
            const templateFilePath = path.join(analyticsResourcePath, 'pinpoint-cloudformation-template.json');
            if (fs_extra_1.default.existsSync(templateFilePath)) {
                const cfn = amplify_cli_core_1.JSONUtilities.readJson(templateFilePath);
                const updatedCfn = migratePinpointCFN(cfn);
                fs_extra_1.default.ensureDirSync(analyticsResourcePath);
                amplify_cli_core_1.JSONUtilities.writeJson(templateFilePath, updatedCfn);
            }
        });
    }
    const pinpointApp = (0, pinpoint_helper_1.getNotificationsCategoryHasPinpointIfExists)();
    if (resources.length === 0 && pinpointApp) {
        const resourceParameters = (0, pinpoint_defaults_1.getAllDefaults)(context.amplify.getProjectDetails());
        const notificationsInfo = {
            appName: pinpointApp.appName,
            resourceName: pinpointApp.appName,
        };
        Object.assign(resourceParameters, notificationsInfo);
        const resource = resourceParameters.resourceName;
        delete resourceParameters.resourceName;
        const analyticsResourcePath = path.join(projectBackendDirPath, amplify_cli_core_1.AmplifyCategories.ANALYTICS, resource);
        amplify_cli_core_1.stateManager.setResourceParametersJson(undefined, amplify_cli_core_1.AmplifyCategories.ANALYTICS, resource, resourceParameters);
        const templateFileName = 'pinpoint-cloudformation-template.json';
        const templateFilePath = path.join(analyticsResourcePath, templateFileName);
        if (!fs_extra_1.default.existsSync(templateFilePath)) {
            const templateSourceFilePath = path.join(__dirname, '..', 'provider-utils', 'awscloudformation', 'cloudformation-templates', templateFileName);
            const { cfnTemplate } = (0, amplify_cli_core_1.readCFNTemplate)(templateSourceFilePath);
            cfnTemplate.Mappings = await (0, pinpoint_helper_1.getPinpointRegionMappings)(context);
            await (0, amplify_cli_core_1.writeCFNTemplate)(cfnTemplate, templateFilePath);
        }
        const options = {
            service: amplify_cli_core_1.AmplifySupportedService.PINPOINT,
            providerPlugin: 'awscloudformation',
        };
        context.amplify.updateamplifyMetaAfterResourceAdd(amplify_cli_core_1.AmplifyCategories.ANALYTICS, resource, options);
        context.parameters.options = (_a = context.parameters.options) !== null && _a !== void 0 ? _a : {};
        context.parameters.options.yes = true;
        context.exeInfo.inputParams = context.exeInfo.inputParams || {};
        context.exeInfo.inputParams.yes = true;
        await (0, plugin_client_api_auth_1.invokeAuthPush)(context);
        await (0, analytics_1.analyticsPush)(context);
    }
};
exports.inAppMessagingMigrationCheck = inAppMessagingMigrationCheck;
const migratePinpointCFN = (cfn) => {
    const { Parameters, Conditions, Resources } = cfn;
    Parameters[pinpoint_helper_1.pinpointInAppMessagingPolicyName] = {
        Type: 'String',
        Default: 'NONE',
    };
    Conditions.ShouldEnablePinpointInAppMessaging = {
        'Fn::Not': [
            {
                'Fn::Equals': [
                    {
                        Ref: 'pinpointInAppMessagingPolicyName',
                    },
                    'NONE',
                ],
            },
        ],
    };
    Resources.PinpointInAppMessagingPolicy = {
        Condition: 'ShouldEnablePinpointInAppMessaging',
        Type: 'AWS::IAM::Policy',
        Properties: {
            PolicyName: {
                Ref: 'pinpointInAppMessagingPolicyName',
            },
            Roles: [
                {
                    Ref: 'unauthRoleName',
                },
                {
                    Ref: 'authRoleName',
                },
            ],
            PolicyDocument: {
                Version: '2012-10-17',
                Statement: [
                    {
                        Effect: 'Allow',
                        Action: ['mobiletargeting:GetInAppMessages'],
                        Resource: [
                            {
                                'Fn::Join': [
                                    '',
                                    [
                                        'arn:aws:mobiletargeting:',
                                        {
                                            'Fn::FindInMap': [
                                                'RegionMapping',
                                                {
                                                    Ref: 'AWS::Region',
                                                },
                                                'pinpointRegion',
                                            ],
                                        },
                                        ':',
                                        {
                                            Ref: 'AWS::AccountId',
                                        },
                                        ':apps/',
                                        {
                                            'Fn::GetAtt': ['PinpointFunctionOutputs', 'Id'],
                                        },
                                        '*',
                                    ],
                                ],
                            },
                        ],
                    },
                ],
            },
        },
    };
    return cfn;
};
//# sourceMappingURL=in-app-messaging-migration.js.map