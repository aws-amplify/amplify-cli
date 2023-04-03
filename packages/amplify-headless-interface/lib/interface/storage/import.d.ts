import { S3ServiceConfigurationBase } from './base';
export interface ImportStorageRequest {
    version: 1;
    serviceConfiguration: ImportS3ServiceConfiguration;
}
export interface ImportS3ServiceConfiguration extends S3ServiceConfigurationBase {
    bucketName: string;
}
//# sourceMappingURL=import.d.ts.map