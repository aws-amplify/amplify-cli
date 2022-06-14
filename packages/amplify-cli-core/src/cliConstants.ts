export const SecretFileMode = 0o600; //file permissions for -rw-------
export const CLISubCommands = {
  ADD: 'add',
  PUSH: 'push',
  PULL: 'pull',
  REMOVE: 'remove',
  UPDATE: 'update',
  CONSOLE: 'console',
  IMPORT: 'import',
};
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
  AWSCLOUDFORMATION: 'awscloudformation',
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
};

export const overriddenCategories = [AmplifyCategories.AUTH, AmplifyCategories.STORAGE, AmplifyCategories.CUSTOM, AmplifyCategories.API];

export type IAmplifyResource = {
  category: string;
  resourceName: string;
  service: string;
};

export const AMPLIFY_DOCS_URL = 'https://docs.amplify.aws';
export const AWS_DOCS_URL = 'https://docs.aws.amazon.com/';
export const AWS_PREMIUM_SUPPORT_URL = 'https://aws.amazon.com/premiumsupport';
/**
 * Amplify support documentation urls and description.
 */
export const AMPLIFY_SUPPORT_DOCS = {
  CLI_PROJECT_TROUBLESHOOTING: {
    name: 'Amplify CLI troubleshooting guide',
    url: `${AMPLIFY_DOCS_URL}/cli/project/troubleshooting/`
  },
  CLI_GRAPHQL_TROUBLESHOOTING: {
    name: 'Amplify CLI GraphQL troubleshooting guide',
    url: `${AMPLIFY_DOCS_URL}/cli/graphql/troubleshooting/`
  },
  CLI_EXTENSIBILITY: {
    name: 'Amplify CLI extensibility guide',
    url: `${AMPLIFY_DOCS_URL}/cli/#extensibility`
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
    url: `${AWS_PREMIUM_SUPPORT_URL}/knowledge-center/`
  },
};
