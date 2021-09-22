import { S3ServiceConfigurationBase } from './base';

/**
 * Service configuration for importing AWS S3 into an Amplify project
 */
export interface ImportStorageRequest {
  version: 1;
  serviceConfiguration: ImportS3ServiceConfiguration;
}

/**
 * Service configuration for AWS S3 through Amplify
 */
export interface ImportS3ServiceConfiguration extends S3ServiceConfigurationBase {
  /**
   * Globally unique bucket name
   */
  bucketName: string;

  /**
   * AWS region, e.g. 'us-west-2' ** TODO SEE IF NECESSARY
   */
  region: string;
}
