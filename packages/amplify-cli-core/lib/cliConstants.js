"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AMPLIFY_SUPPORT_DOCS = exports.AWS_PREMIUM_SUPPORT_URL = exports.AWS_DOCS_URL = exports.AMPLIFY_DOCS_URL = exports.NotificationChannels = exports.PluginAPIError = exports.overriddenCategories = exports.AmplifySupportedService = exports.AmplifyCategories = exports.CLISubCommandType = exports.CLISubCommands = exports.SecretFileMode = void 0;
exports.SecretFileMode = 384;
exports.CLISubCommands = {
    ADD: 'add',
    PUSH: 'push',
    PULL: 'pull',
    REMOVE: 'remove',
    UPDATE: 'update',
    CONSOLE: 'console',
    IMPORT: 'import',
};
var CLISubCommandType;
(function (CLISubCommandType) {
    CLISubCommandType["ADD"] = "add";
    CLISubCommandType["PUSH"] = "push";
    CLISubCommandType["PULL"] = "pull";
    CLISubCommandType["REMOVE"] = "remove";
    CLISubCommandType["UPDATE"] = "update";
    CLISubCommandType["CONSOLE"] = "console";
    CLISubCommandType["IMPORT"] = "import";
    CLISubCommandType["OVERRIDE"] = "override";
    CLISubCommandType["MIGRATE"] = "migrate";
})(CLISubCommandType = exports.CLISubCommandType || (exports.CLISubCommandType = {}));
exports.AmplifyCategories = {
    STORAGE: 'storage',
    API: 'api',
    AUTH: 'auth',
    FUNCTION: 'function',
    HOSTING: 'hosting',
    INTERACTIONS: 'interactions',
    NOTIFICATIONS: 'notifications',
    PREDICTIONS: 'predictions',
    ANALYTICS: 'analytics',
    CUSTOM: 'custom',
};
exports.AmplifySupportedService = {
    APIGW: 'API Gateway',
    APPSYNC: 'AppSync',
    S3: 'S3',
    DYNAMODB: 'DynamoDB',
    COGNITO: 'Cognito',
    COGNITOUSERPOOLGROUPS: 'Cognito-UserPool-Groups',
    LAMBDA: 'Lambda',
    LAMBDA_LAYER: 'LambdaLayer',
    PINPOINT: 'Pinpoint',
    KINESIS: 'Kinesis',
};
exports.overriddenCategories = [exports.AmplifyCategories.AUTH, exports.AmplifyCategories.STORAGE, exports.AmplifyCategories.CUSTOM, exports.AmplifyCategories.API];
var PluginAPIError;
(function (PluginAPIError) {
    PluginAPIError["E_NO_RESPONSE"] = "E_NO_RESPONSE";
    PluginAPIError["E_UNKNOWN"] = "E_UNKNOWN";
    PluginAPIError["E_NO_SVC_PROVIDER"] = "E_NO_SVC_PROVIDER";
    PluginAPIError["E_SVC_PROVIDER_NO_CAPABILITY"] = "E_SVC_PROVIDER_NO_CAPABILITY";
    PluginAPIError["E_SVC_PROVIDER_SDK"] = "E_SVC_SDK";
    PluginAPIError["E_SVC_PROVIDER_CDK"] = "E_SVC_CDK";
    PluginAPIError["E_PUSH_FAILED"] = "E_PUSH_FAILED";
})(PluginAPIError = exports.PluginAPIError || (exports.PluginAPIError = {}));
var NotificationChannels;
(function (NotificationChannels) {
    NotificationChannels["APNS"] = "APNS";
    NotificationChannels["FCM"] = "FCM";
    NotificationChannels["EMAIL"] = "Email";
    NotificationChannels["SMS"] = "SMS";
    NotificationChannels["IN_APP_MSG"] = "InAppMessaging";
    NotificationChannels["PUSH_NOTIFICATION"] = "PushNotification";
})(NotificationChannels = exports.NotificationChannels || (exports.NotificationChannels = {}));
exports.AMPLIFY_DOCS_URL = 'https://docs.amplify.aws';
exports.AWS_DOCS_URL = 'https://docs.aws.amazon.com/';
exports.AWS_PREMIUM_SUPPORT_URL = 'https://aws.amazon.com/premiumsupport';
exports.AMPLIFY_SUPPORT_DOCS = {
    CLI_PROJECT_TROUBLESHOOTING: {
        name: 'Amplify CLI troubleshooting guide',
        url: `${exports.AMPLIFY_DOCS_URL}/cli/project/troubleshooting/`,
    },
    CLI_GRAPHQL_TROUBLESHOOTING: {
        name: 'Amplify CLI GraphQL troubleshooting guide',
        url: `${exports.AMPLIFY_DOCS_URL}/cli/graphql/troubleshooting/`,
    },
    CLI_EXTENSIBILITY: {
        name: 'Amplify CLI extensibility guide',
        url: `${exports.AMPLIFY_DOCS_URL}/cli/#extensibility`,
    },
    AWS_CUSTOM_DOMAIN_TROUBLESHOOTING: {
        name: 'AWS custom domain troubleshooting guide',
        url: `${exports.AWS_DOCS_URL}/amplify/latest/userguide/custom-domain-troubleshoot-guide.html`,
    },
    AMPLIFY_IAM_TROUBLESHOOTING_URL: {
        name: 'AWS IAM troubleshooting guide',
        url: `${exports.AWS_DOCS_URL}/amplify/latest/userguide/security_iam_troubleshoot.html`,
    },
    AMPLIFY_DATASTORE: {
        name: 'Amplify datastore best practices',
        url: `${exports.AWS_DOCS_URL}/whitepapers/latest/amplify-datastore-implementation/amplify-datastore-best-practices.html`,
    },
    AWS_CLOUDFORMATION_DRIFT: {
        name: 'AWS CloudFormation drift',
        url: `${exports.AWS_DOCS_URL}/AWSCloudFormation/latest/UserGuide/using-cfn-stack-drift.html`,
    },
    AWS_KNOWLEDGE_CENTER: {
        name: 'AWS knowledge center',
        url: `${exports.AWS_PREMIUM_SUPPORT_URL}/knowledge-center/`,
    },
};
//# sourceMappingURL=cliConstants.js.map