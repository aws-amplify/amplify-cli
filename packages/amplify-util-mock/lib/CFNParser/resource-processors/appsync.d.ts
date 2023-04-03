import { CloudFormationProcessedResourceResult } from '../stack/types';
import { CloudFormationParseContext } from '../types';
export declare function dynamoDBResourceHandler(resourceName: any, resource: any): any;
export type AppSyncDataSourceProcessedResource = CloudFormationProcessedResourceResult & {
    name: string;
    type: 'AMAZON_DYNAMODB' | 'AWS_LAMBDA' | 'AMAZON_ELASTICSEARCH' | 'NONE';
    LambdaFunctionArn?: string;
    config?: {
        tableName: string;
    };
};
export declare function appSyncDataSourceHandler(resourceName: any, resource: any, cfnContext: CloudFormationParseContext): AppSyncDataSourceProcessedResource;
export type AppSyncAPIProcessedResource = CloudFormationProcessedResourceResult & {
    name: string;
    Ref: string;
    Arn: string;
    defaultAuthenticationType: any;
    ApiId: string;
    GraphQLUrl: string;
    additionalAuthenticationProviders: any;
};
export declare function appSyncAPIResourceHandler(resourceName: any, resource: any, cfnContext: CloudFormationParseContext): AppSyncAPIProcessedResource;
export type AppSyncAPIKeyProcessedResource = CloudFormationProcessedResourceResult & {
    ApiKey: string;
    Ref: string;
};
export declare function appSyncAPIKeyResourceHandler(): AppSyncAPIKeyProcessedResource;
export type AppSyncSchemaProcessedResource = CloudFormationProcessedResourceResult & {
    definitionS3Location?: string;
    definition?: string;
};
export declare function appSyncSchemaHandler(resourceName: any, resource: any, cfnContext: CloudFormationParseContext): AppSyncSchemaProcessedResource;
export type AppSyncResolverProcessedResource = CloudFormationProcessedResourceResult & {
    dataSourceName?: string;
    functions: string[];
    typeName: string;
    fieldName: string;
    requestMappingTemplateLocation?: string;
    responseMappingTemplateLocation?: string;
    requestMappingTemplate?: string;
    responseMappingTemplate?: string;
    ResolverArn: string;
    kind: 'UNIT' | 'PIPELINE';
};
export declare function appSyncResolverHandler(resourceName: any, resource: any, cfnContext: CloudFormationParseContext): AppSyncResolverProcessedResource;
export type AppSyncFunctionProcessedResource = CloudFormationProcessedResourceResult & {
    dataSourceName: string;
    ref: string;
    name: string;
    requestMappingTemplateLocation?: string;
    responseMappingTemplateLocation?: string;
    requestMappingTemplate?: string;
    responseMappingTemplate?: string;
};
export declare function appSyncFunctionHandler(resourceName: any, resource: any, cfnContext: CloudFormationParseContext): AppSyncFunctionProcessedResource;
//# sourceMappingURL=appsync.d.ts.map