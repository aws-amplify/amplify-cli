/**
 * Service configuration for AWS S3 through Amplify
 */
export interface S3ServiceConfigurationBase {
  /**
   * Descriminant used to determine the service config type
   */
  serviceName: 'S3';
}

/**
 * Permissions that should be applied to the bucket
 */
export interface S3Permissions {
  /**
   * Permissions for authenticated users
   */
  auth: CrudOperation[];

  /**
   * Permissions for unauthenticated users
   */
  guest?: CrudOperation[];

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
   * Each key is a Cognito user group name and each value is the CRUD opterations permitted for that group
   */
  [k: string]: CrudOperation[];
}

/**
 * Lambda function that runs on bucket change
 */
export interface LambdaTriggerConfig {
  mode: 'new' | 'existing';
  name: string;
}

export enum CrudOperation {
  CREATE_AND_UPDATE = 'CREATE_AND_UPDATE',
  READ = 'READ',
  DELETE = 'DELETE',
}
