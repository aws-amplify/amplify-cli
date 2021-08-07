/**
 * CLI Inputs Data for S3 resource
 */
export interface AddStorageRequest {
  version: 1;
  serviceConfiguration: S3ServiceConfiguration;
}

/**
 * Service configuration for AWS S3 through Amplify
 */
export interface S3ServiceConfiguration {
  /**
   * Descriminant used to determine the service config type
   */
  serviceName: 's3';
  /**
   * The permissions that should be applied to the bucket
   */
  permissions: S3Permissions;
  /**
   * Globally unique bucket name
   */
  bucketName: string;
  /**
   * Optional parameter specifying a lambda that should run when the bucket is modified
   */
  lambdaTrigger?: LambdaTriggerConfig;
}

/**
 * Permissions that should be applied to the bucket
 */
export interface S3Permissions {
  /**
   * Permissions for authenticated users
   */
  auth: CrudPermissions;

  /**
   * Permissions for unauthenticated users
   */
  guest?: CrudPermissions;

  /**
   * Permissions for Cognito user groups
   */
  groups?: PermissionGroups;
}

/**
 * Permissions for Cognito user groups
 */
export interface PermissionGroups {
  /**
   * Each key is a Cognito user group name and each value is the CRUD operations permitted for that group
   */
  [k: string]: CrudPermissions;
}

/**
 * Lambda function that runs on bucket change
 */
export interface LambdaTriggerConfig {
  mode: 'new' | 'existing';
  name: string;
}

export type CrudPermissions = {
  CREATE : boolean,
  READ   : boolean,
  UPDATE : boolean,
  DELETE : boolean
}
