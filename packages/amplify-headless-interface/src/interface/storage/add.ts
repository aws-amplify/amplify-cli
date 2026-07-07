import { LambdaTriggerConfig, S3Permissions, S3ServiceConfigurationBase } from './base';

/**
 * Service configuration for adding AWS S3 through Amplify
 */
export interface AddStorageRequest {
  version: 1;
  serviceConfiguration: AddS3ServiceConfiguration;
}

/**
 * Service configuration for AWS S3 through Amplify
 */
export interface AddS3ServiceConfiguration extends S3ServiceConfigurationBase {
  /**
   * The permissions that should be applied to the bucket
   */
  permissions: S3Permissions;

  /**
   * Amplify resource name
   */
  resourceName?: string;

  /**
   * Globally unique bucket name - bucket names must be lowercase
   */
  bucketName?: string;

  /**
   * Optional parameter specifying a lambda that should run when the bucket is modified
   */
  lambdaTrigger?: LambdaTriggerConfig;
}
