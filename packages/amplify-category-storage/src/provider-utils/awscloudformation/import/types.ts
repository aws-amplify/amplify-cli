import { $TSContext, $TSObject } from '@aws-amplify/amplify-cli-core';
import { IDynamoDBService, IS3Service } from '@aws-amplify/amplify-util-import';
import { Bucket } from '@aws-sdk/client-s3';
import { TableDescription } from '@aws-sdk/client-dynamodb';

// parameters.json
export type S3ResourceParameters = {
  resourceName: string;
  serviceType: 'imported'; // string literal, not changing for import
};

// Persisted into amplify-meta
export type S3BackendConfiguration = {
  service: 'S3'; // string literal for this category
  serviceType: 'imported'; // string literal, not changing for import
  providerPlugin: string;
  dependsOn: $TSObject[];
};

// Persisted into amplify-meta
export type S3MetaConfiguration = S3BackendConfiguration & {
  output: S3MetaOutput;
};

// Persisted into amplify-meta
export type S3MetaOutput = {
  BucketName?: string;
  Region?: string;
};

// Persisted into team-provider-info
export type S3EnvSpecificResourceParameters = {
  bucketName: string;
  region: string;
};

export type S3ImportAnswers = {
  resourceName?: string;
  bucketName?: string;
};

export type S3ImportParameters = {
  providerName: string;
  bucketList: Bucket[];
  region?: string;
};

export type ImportS3HeadlessParameters = {
  bucketName: string;
  region: string;
};

export interface ProviderUtils {
  createS3Service(context: $TSContext): Promise<IS3Service>;
  createDynamoDBService(context: $TSContext): Promise<IDynamoDBService>;
}

// parameters.json
export type DynamoDBResourceParameters = {
  resourceName: string;
  serviceType: 'imported'; // string literal, not changing for import
};

// Persisted into amplify-meta
export type DynamoDBBackendConfiguration = {
  service: 'DynamoDB'; // string literal for this category
  serviceType: 'imported'; // string literal, not changing for import
  providerPlugin: string;
  dependsOn: $TSObject[];
};

// Persisted into amplify-meta
export type DynamoDBMetaConfiguration = DynamoDBBackendConfiguration & {
  output: DynamoDBMetaOutput;
};

// Persisted into amplify-meta
export type DynamoDBMetaOutput = {
  Name?: string;
  Region?: string;
  Arn?: string;
  StreamArn?: string;
  PartitionKeyName?: string;
  PartitionKeyType?: string;
  SortKeyName?: string;
  SortKeyType?: string;
};

// Persisted into team-provider-info
export type DynamoDBEnvSpecificResourceParameters = {
  tableName: string;
  region: string;
  arn?: string;
  streamArn?: string;
  partitionKeyName?: string;
  partitionKeyType?: string;
  sortKeyName?: string;
  sortKeyType?: string;
};

export type DynamoDBImportAnswers = {
  resourceName?: string;
  tableName?: string;
  tableDescription?: TableDescription;
};

export type DynamoDBImportParameters = {
  providerName: string;
  tableList: string[];
  region?: string;
};

export type ImportDynamoDBHeadlessParameters = {
  tables: Record<string, string>;
  region: string;
};
