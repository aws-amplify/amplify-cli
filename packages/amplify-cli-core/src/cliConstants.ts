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
  FUNCTION: 'function',
  HOSTING: 'hosting',
  INTERACTIONS: 'interactions',
  NOTIFICATIONS: 'notifications',
  PREDICTIONS: 'predictions',
  ANALYTICS: 'analytics',
};

export const AmplifySupportedService = {
  APIGW: 'API Gateway',
  APPSYNC: 'AppSync',
  S3: 'S3',
  DYNAMODB: 'DynamoDB',
  COGNITO: 'Cognito',
  COGNITOUSERPOOLGROUPS: 'Cognito-UserPool-Groups',
  LAMBDA: 'Lambda',
};

export const overriddenCategories = [AmplifyCategories.AUTH, AmplifyCategories.STORAGE];

export type IAmplifyResource = {
  category: string;
  resourceName: string;
  service: string;
};
