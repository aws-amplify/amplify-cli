import { S3ServiceConfigurationBase } from './base';
export interface RemoveStorageRequest {
    version: 1;
    serviceConfiguration: RemoveS3ServiceConfiguration;
}
export interface RemoveS3ServiceConfiguration extends S3ServiceConfigurationBase {
    resourceName: string;
    deleteBucketAndContents?: boolean;
}
//# sourceMappingURL=remove.d.ts.map