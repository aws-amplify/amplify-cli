import { LambdaTriggerConfig, S3Permissions, S3ServiceConfigurationBase } from './base';
export interface AddStorageRequest {
    version: 1;
    serviceConfiguration: AddS3ServiceConfiguration;
}
export interface AddS3ServiceConfiguration extends S3ServiceConfigurationBase {
    permissions: S3Permissions;
    resourceName?: string;
    bucketName?: string;
    lambdaTrigger?: LambdaTriggerConfig;
}
//# sourceMappingURL=add.d.ts.map