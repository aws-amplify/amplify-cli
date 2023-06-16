import { $TSAny } from '.';

/* eslint-disable spellcheck/spell-checker */
export const SecretFileMode = 0o6_0_0; // file permissions for -rw-------
export const CLISubCommands = {
  ADD: 'add',
  PUSH: 'push',
  PULL: 'pull',
  REMOVE: 'remove',
  UPDATE: 'update',
  CONSOLE: 'console',
  IMPORT: 'import',
};

/**
 * CLI command types to be implemented across all categories.
 */
export enum CLISubCommandType {
  ADD = 'add',
  PUSH = 'push',
  PULL = 'pull',
  REMOVE = 'remove',
  UPDATE = 'update',
  CONSOLE = 'console',
  IMPORT = 'import',
  OVERRIDE = 'override',
  MIGRATE = 'migrate',
}
export const AmplifyCategories = {
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
export const AmplifySupportedService = {
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

export const overriddenCategories = [AmplifyCategories.AUTH, AmplifyCategories.STORAGE, AmplifyCategories.CUSTOM, AmplifyCategories.API];

/**
 * Amplify Resource data queried from amplify-meta
 */
export interface IAmplifyResource {
  category: string;
  resourceName: string;
  service: string;
  id?: string;
  region?: string;
}

/**
 * Plugin API Error codes.
 */
export enum PluginAPIError {
  E_NO_RESPONSE = 'E_NO_RESPONSE', // no resources found for given category/filter
  E_UNKNOWN = 'E_UNKNOWN', // unknown error.The downstream API needs to be refactored to return a more specific error code.
  E_NO_SVC_PROVIDER = 'E_NO_SVC_PROVIDER', // Given AWS service is not a provider for a given category
  E_SVC_PROVIDER_NO_CAPABILITY = 'E_SVC_PROVIDER_NO_CAPABILITY', // Provider does not support requested capability
  E_SVC_PROVIDER_SDK = 'E_SVC_SDK', // Generic error thrown by AWS SDK
  E_SVC_PROVIDER_CDK = 'E_SVC_CDK', // Generic error thrown by AWS CDK
  E_PUSH_FAILED = 'E_PUSH_FAILED', // Resource Push failed
}

/**
 * Generic response structure for Plugin API response.
 * This could be extended to return specific API response
 */
export interface IPluginAPIResponse {
  pluginName: string;
  resourceProviderServiceName: string; // Service which provisions capability, subCapability e.g Pinpoint
  status: boolean; // true - successfully applied, false - failed to apply
  errorCode?: PluginAPIError;
  reasonMsg?: string; // In case of error, a user readable error string
}

/**
 * Plugin API response when client configures a capability ( e.g notifications )
 */
export interface IPluginCapabilityAPIResponse extends IPluginAPIResponse {
  capability: string; // e.g Notifications
  subCapability?: string; // e.g In-AppMessaging
}

/**
 * Notification Channels supported in Amplify
 */
export enum NotificationChannels {
  APNS = 'APNS',
  FCM = 'FCM',
  EMAIL = 'Email',
  SMS = 'SMS',
  IN_APP_MSG = 'InAppMessaging',
  PUSH_NOTIFICATION = 'PushNotification',
}

/**
 * Notifications category metadata
 */
export interface INotificationsResourceMeta {
  Id: string; // unique identifier for AWS service resource allocated for Notifications
  Name: string; // region specific logical identifier for AWS service resource
  Region: string; // Region in which Notifications resource is deployed.
  ResourceName: string; // Logical name of Notifications App.
  service: string; // AWS Service e.g Pinpoint (small s for legacy support)
  output: Record<string, $TSAny>;
  mobileHubMigrated?: boolean;
  lastPushTimeStamp?: string;
  lastPushDirHash?: string; // this is a pseudo field since all notification pushes are through analytics or sdk
}

/**
 * Amplify Analytics Resource data queried from amplify-meta
 */
export interface IAnalyticsResource extends IAmplifyResource {
  id?: string;
  region?: string;
  output?: $TSAny; // cloudformation deployment outputs - indicates resource deployed
}

/**
 * Amplify Notifications Resource data queried from amplify-meta
 * note:- assigned to analytics until output for each notifications type is added
 */
export type INotificationsResource = IAnalyticsResource;

/**
 * Amplify Auth Resource data queried from amplify-meta
 */
export type IAuthResource = IAmplifyResource;

export const AMPLIFY_DOCS_URL = 'https://docs.amplify.aws';
export const AWS_DOCS_URL = 'https://docs.aws.amazon.com/';
export const AWS_PREMIUM_SUPPORT_URL = 'https://aws.amazon.com/premiumsupport';

/**
 * Amplify support documentation urls and description.
 */
export const AMPLIFY_SUPPORT_DOCS = {
  CLI_PROJECT_TROUBLESHOOTING: {
    name: 'Amplify CLI troubleshooting guide',
    url: `${AMPLIFY_DOCS_URL}/cli/project/troubleshooting/`,
  },
  CLI_GRAPHQL_TROUBLESHOOTING: {
    name: 'Amplify CLI GraphQL troubleshooting guide',
    url: `${AMPLIFY_DOCS_URL}/cli/graphql/troubleshooting/`,
  },
  CLI_EXTENSIBILITY: {
    name: 'Amplify CLI extensibility guide',
    url: `${AMPLIFY_DOCS_URL}/cli/#extensibility`,
  },
  AWS_CUSTOM_DOMAIN_TROUBLESHOOTING: {
    name: 'AWS custom domain troubleshooting guide',
    url: `${AWS_DOCS_URL}/amplify/latest/userguide/custom-domain-troubleshoot-guide.html`,
  },
  AMPLIFY_IAM_TROUBLESHOOTING_URL: {
    name: 'AWS IAM troubleshooting guide',
    url: `${AWS_DOCS_URL}/amplify/latest/userguide/security_iam_troubleshoot.html`,
  },
  AMPLIFY_DATASTORE: {
    name: 'Amplify datastore best practices',
    url: `${AWS_DOCS_URL}/whitepapers/latest/amplify-datastore-implementation/amplify-datastore-best-practices.html`,
  },
  AWS_CLOUDFORMATION_DRIFT: {
    name: 'AWS CloudFormation drift',
    url: `${AWS_DOCS_URL}/AWSCloudFormation/latest/UserGuide/using-cfn-stack-drift.html`,
  },
  AWS_KNOWLEDGE_CENTER: {
    name: 'AWS knowledge center',
    url: `${AWS_PREMIUM_SUPPORT_URL}/knowledge-center/`,
  },
};
