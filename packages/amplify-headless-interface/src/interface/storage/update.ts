import { LambdaTriggerConfig, S3Permissions, S3ServiceConfigurationBase } from './base';

/**
 * Service configuration for updating AWS S3 through Amplify
 */
export interface UpdateStorageRequest {
  version: 1;
  serviceModification: UpdateS3ServiceModification;
}

/**
 * Service modification for AWS S3 through Amplify
 */
export interface UpdateS3ServiceModification extends S3ServiceConfigurationBase {
  /**
   * The permissions that should be applied to the bucket
   */
  permissions: S3Permissions;

  /**
   * Amplify resource name
   */
  resourceName: string;

  /**
   * Optional parameter specifying a lambda that should run when the bucket is modified
   */
  lambdaTrigger?: LambdaTriggerConfig;
}
