import ts from 'typescript';
import { Lambda } from '../functions/lambda';
import { BucketAccelerateStatus, BucketVersioningStatus, ServerSideEncryptionByDefault } from '@aws-sdk/client-s3';
export type S3TriggerDefinition = Record<string, never>;
export type Permission = 'read' | 'write' | 'create' | 'delete';
export type GroupPermissions<G extends readonly string[]> = {
  [Key in G[number]]: Permission[];
};
export type StorageTriggerEvent = 'onDelete' | 'onUpload';
export type AccessPatterns = {
  auth?: Permission[];
  guest?: Permission[];
  groups?: Record<string, Permission[]>;
};
export type ServerSideEncryptionConfiguration = {
  serverSideEncryptionByDefault: ServerSideEncryptionByDefault;
  bucketKeyEnabled: boolean;
};
export interface StorageRenderParameters {
  bucketName?: string;
  triggers?: Partial<Record<StorageTriggerEvent, Lambda>>;
  accessPatterns?: AccessPatterns;
  storageIdentifier?: string;
  lambdas?: S3TriggerDefinition[];
  bucketEncryptionAlgorithm?: ServerSideEncryptionConfiguration;
  dynamoDB?: string;
  accelerateConfiguration?: BucketAccelerateStatus;
  versioningConfiguration?: BucketVersioningStatus;
}
export declare const renderStorage: (storageParams?: StorageRenderParameters) => ts.NodeArray<ts.Node>;
//# sourceMappingURL=index.d.ts.map
