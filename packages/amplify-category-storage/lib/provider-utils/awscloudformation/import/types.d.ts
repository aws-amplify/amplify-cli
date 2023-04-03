import { $TSContext, $TSObject } from 'amplify-cli-core';
import { IDynamoDBService, IS3Service } from '@aws-amplify/amplify-util-import';
import { Bucket } from 'aws-sdk/clients/s3';
import { TableDescription } from 'aws-sdk/clients/dynamodb';
export type S3ResourceParameters = {
    resourceName: string;
    serviceType: 'imported';
};
export type S3BackendConfiguration = {
    service: 'S3';
    serviceType: 'imported';
    providerPlugin: string;
    dependsOn: $TSObject[];
};
export type S3MetaConfiguration = S3BackendConfiguration & {
    output: S3MetaOutput;
};
export type S3MetaOutput = {
    BucketName?: string;
    Region?: string;
};
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
export type DynamoDBResourceParameters = {
    resourceName: string;
    serviceType: 'imported';
};
export type DynamoDBBackendConfiguration = {
    service: 'DynamoDB';
    serviceType: 'imported';
    providerPlugin: string;
    dependsOn: $TSObject[];
};
export type DynamoDBMetaConfiguration = DynamoDBBackendConfiguration & {
    output: DynamoDBMetaOutput;
};
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
//# sourceMappingURL=types.d.ts.map