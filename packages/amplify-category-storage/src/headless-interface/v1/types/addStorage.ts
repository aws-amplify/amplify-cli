export interface AddStorage {
  version: number,
  serviceConfiguration: S3ServiceConfiguration | DynamoDBServiceConfiguration
}

export interface S3ServiceConfiguration {
  serviceName: 's3'
  permissions: S3Permissions
  /**
   * Globally unique bucket name
   */
  bucketName: string
  lambdaTrigger?: LambdaTriggerConfig
}
/**
 * Permissions that should be applied to the bucket
 */
export interface S3Permissions {
  /**
   * Permissions for unauthenticated users
   */
  guest?: CrudOperations[]
  /**
   * Permissions for authenticated users
   */
  auth?: CrudOperations[]
  groups?: PermissionGroups
}
/**
 * Permissions for Cognito user groups
 */
export interface PermissionGroups {
  /**
   * This interface was referenced by `PermissionGroups`'s JSON-Schema definition
   * via the `patternProperty` "^.*$".
   */
  [k: string]: CrudOperations[]
}
/**
 * Lambda function that runs on bucket change
 */
export interface LambdaTriggerConfig {
  mode: "new" | "existing"
  name: string
}

/**
 * Placeholder definition for DynamoDB config
 */
export interface DynamoDBServiceConfiguration {
  serviceName: 'dynamoDB'
  placeholder: string
}

export const enum CrudOperations {
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
}
