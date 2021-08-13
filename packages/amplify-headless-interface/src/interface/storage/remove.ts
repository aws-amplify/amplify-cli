import { S3ServiceConfigurationBase } from './base';

/**
 * Service configuration for removing AWS S3 through Amplify
 */
export interface RemoveStorageRequest {
  version: 1;
  serviceConfiguration: RemoveS3ServiceConfiguration;
}

/**
 * Service configuration for AWS S3 through Amplify
 */
export interface RemoveS3ServiceConfiguration extends S3ServiceConfigurationBase {
  /**
   * Amplify resource name
   */
  resourceName: string;

  /**
   * Delete data and clean up resource entirely
   */
  deleteBucketAndContents: boolean;
}
