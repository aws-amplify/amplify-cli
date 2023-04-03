import { LambdaTriggerConfig, S3Permissions, S3ServiceConfigurationBase } from './base';
export interface UpdateStorageRequest {
    version: 1;
    serviceModification: UpdateS3ServiceModification;
}
export interface UpdateS3ServiceModification extends S3ServiceConfigurationBase {
    permissions: S3Permissions;
    resourceName: string;
    lambdaTrigger?: LambdaTriggerConfig;
}
//# sourceMappingURL=update.d.ts.map