import type { EnvironmentResponse, Runtime } from '@aws-sdk/client-lambda';

/**
 * Auth access permissions for a Lambda function.
 */
export interface AuthAccess {
  manageUsers?: boolean;
  manageGroups?: boolean;
  manageGroupMembership?: boolean;
  manageUserDevices?: boolean;
  managePasswordRecovery?: boolean;
  addUserToGroup?: boolean;
  createUser?: boolean;
  deleteUser?: boolean;
  deleteUserAttributes?: boolean;
  disableUser?: boolean;
  enableUser?: boolean;
  forgetDevice?: boolean;
  getDevice?: boolean;
  getUser?: boolean;
  listUsers?: boolean;
  listDevices?: boolean;
  listGroupsForUser?: boolean;
  listUsersInGroup?: boolean;
  listGroups?: boolean;
  removeUserFromGroup?: boolean;
  resetUserPassword?: boolean;
  setUserMfaPreference?: boolean;
  setUserPassword?: boolean;
  setUserSettings?: boolean;
  updateDeviceStatus?: boolean;
  updateUserAttributes?: boolean;
}

/**
 * Represents a function definition extracted from a Gen1 project.
 */
export interface FunctionDefinition {
  /** The Amplify category this function belongs to */
  category?: string;
  /** The entry point file path for the function */
  entry?: string;
  /** The AWS Lambda function name */
  name?: string;
  /** Maximum execution time in seconds */
  timeoutSeconds?: number;
  /** Memory allocation in MB */
  memoryMB?: number;
  /** Environment variables configuration from AWS Lambda */
  environment?: EnvironmentResponse;
  /** Environment variables filtered out by adapters */
  filteredEnvironmentVariables?: Record<string, string>;
  /** AWS Lambda runtime */
  runtime?: Runtime | string;
  /** The Amplify resource name */
  resourceName?: string;
  /** CloudWatch Events schedule expression */
  schedule?: string;
  /** Auth access permissions for this function */
  authAccess?: AuthAccess;
  /** Specific API permissions detected from CloudFormation analysis */
  apiPermissions?: {
    hasQuery: boolean;
    hasMutation: boolean;
    hasSubscription: boolean;
  };
}
