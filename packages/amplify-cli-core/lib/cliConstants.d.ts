import { $TSAny } from '.';
export declare const SecretFileMode = 384;
export declare const CLISubCommands: {
    ADD: string;
    PUSH: string;
    PULL: string;
    REMOVE: string;
    UPDATE: string;
    CONSOLE: string;
    IMPORT: string;
};
export declare enum CLISubCommandType {
    ADD = "add",
    PUSH = "push",
    PULL = "pull",
    REMOVE = "remove",
    UPDATE = "update",
    CONSOLE = "console",
    IMPORT = "import",
    OVERRIDE = "override",
    MIGRATE = "migrate"
}
export declare const AmplifyCategories: {
    STORAGE: string;
    API: string;
    AUTH: string;
    FUNCTION: string;
    HOSTING: string;
    INTERACTIONS: string;
    NOTIFICATIONS: string;
    PREDICTIONS: string;
    ANALYTICS: string;
    CUSTOM: string;
};
export declare const AmplifySupportedService: {
    APIGW: string;
    APPSYNC: string;
    S3: string;
    DYNAMODB: string;
    COGNITO: string;
    COGNITOUSERPOOLGROUPS: string;
    LAMBDA: string;
    LAMBDA_LAYER: string;
    PINPOINT: string;
    KINESIS: string;
};
export declare const overriddenCategories: string[];
export interface IAmplifyResource {
    category: string;
    resourceName: string;
    service: string;
    id?: string;
    region?: string;
}
export declare enum PluginAPIError {
    E_NO_RESPONSE = "E_NO_RESPONSE",
    E_UNKNOWN = "E_UNKNOWN",
    E_NO_SVC_PROVIDER = "E_NO_SVC_PROVIDER",
    E_SVC_PROVIDER_NO_CAPABILITY = "E_SVC_PROVIDER_NO_CAPABILITY",
    E_SVC_PROVIDER_SDK = "E_SVC_SDK",
    E_SVC_PROVIDER_CDK = "E_SVC_CDK",
    E_PUSH_FAILED = "E_PUSH_FAILED"
}
export interface IPluginAPIResponse {
    pluginName: string;
    resourceProviderServiceName: string;
    status: boolean;
    errorCode?: PluginAPIError;
    reasonMsg?: string;
}
export interface IPluginCapabilityAPIResponse extends IPluginAPIResponse {
    capability: string;
    subCapability?: string;
}
export declare enum NotificationChannels {
    APNS = "APNS",
    FCM = "FCM",
    EMAIL = "Email",
    SMS = "SMS",
    IN_APP_MSG = "InAppMessaging",
    PUSH_NOTIFICATION = "PushNotification"
}
export interface INotificationsResourceMeta {
    Id: string;
    Name: string;
    Region: string;
    ResourceName: string;
    service: string;
    output: Record<string, $TSAny>;
    mobileHubMigrated?: boolean;
    lastPushTimeStamp?: string;
    lastPushDirHash?: string;
}
export interface IAnalyticsResource extends IAmplifyResource {
    id?: string;
    region?: string;
    output?: $TSAny;
}
export type INotificationsResource = IAnalyticsResource;
export type IAuthResource = IAmplifyResource;
export declare const AMPLIFY_DOCS_URL = "https://docs.amplify.aws";
export declare const AWS_DOCS_URL = "https://docs.aws.amazon.com/";
export declare const AWS_PREMIUM_SUPPORT_URL = "https://aws.amazon.com/premiumsupport";
export declare const AMPLIFY_SUPPORT_DOCS: {
    CLI_PROJECT_TROUBLESHOOTING: {
        name: string;
        url: string;
    };
    CLI_GRAPHQL_TROUBLESHOOTING: {
        name: string;
        url: string;
    };
    CLI_EXTENSIBILITY: {
        name: string;
        url: string;
    };
    AWS_CUSTOM_DOMAIN_TROUBLESHOOTING: {
        name: string;
        url: string;
    };
    AMPLIFY_IAM_TROUBLESHOOTING_URL: {
        name: string;
        url: string;
    };
    AMPLIFY_DATASTORE: {
        name: string;
        url: string;
    };
    AWS_CLOUDFORMATION_DRIFT: {
        name: string;
        url: string;
    };
    AWS_KNOWLEDGE_CENTER: {
        name: string;
        url: string;
    };
};
//# sourceMappingURL=cliConstants.d.ts.map