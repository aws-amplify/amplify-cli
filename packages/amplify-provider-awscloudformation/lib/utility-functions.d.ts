import { getAccountId } from "./amplify-sts";
export declare function zipFiles(context: any, [srcDir, dstZipFilePath]: [any, any]): Promise<any>;
export declare function isDomainInZones(context: any, { domain }: {
    domain: any;
}): Promise<AWS.Route53.HostedZone>;
export declare function compileSchema(context: any, options: any): Promise<import("graphql-transformer-core").DeploymentResources>;
export declare function buildOverrides(context: any, options: any): Promise<void>;
export declare function newSecret(context: any, options: any): Promise<import("aws-sdk/lib/request").PromiseResult<AWS.SecretsManager.CreateSecretResponse, AWS.AWSError>>;
export declare function updateSecret(context: any, options: any): Promise<import("aws-sdk/lib/request").PromiseResult<AWS.SecretsManager.UpdateSecretResponse, AWS.AWSError>>;
export declare function upsertSecretValue(context: any, options: any): Promise<import("aws-sdk/lib/request").PromiseResult<AWS.SecretsManager.CreateSecretResponse, AWS.AWSError> | import("aws-sdk/lib/request").PromiseResult<AWS.SecretsManager.PutSecretValueResponse, AWS.AWSError>>;
export declare function putSecretValue(context: any, options: any): Promise<import("aws-sdk/lib/request").PromiseResult<AWS.SecretsManager.PutSecretValueResponse, AWS.AWSError>>;
export declare function retrieveSecret(context: any, options: {
    secretArn: string;
}): Promise<import("aws-sdk/lib/request").PromiseResult<AWS.SecretsManager.GetSecretValueResponse, AWS.AWSError>>;
export { getAccountId };
export declare function getTransformerDirectives(context: any, options: any): Promise<string>;
export declare function getRegions(): string[];
export declare function getRegionMappings(): {
    'us-east-1': string;
    'us-east-2': string;
    'us-west-1': string;
    'us-west-2': string;
    'eu-north-1': string;
    'eu-south-1': string;
    'eu-west-1': string;
    'eu-west-2': string;
    'eu-west-3': string;
    'eu-central-1': string;
    'ap-northeast-1': string;
    'ap-northeast-2': string;
    'ap-southeast-1': string;
    'ap-southeast-2': string;
    'ap-south-1': string;
    'ca-central-1': string;
    'me-south-1': string;
    'sa-east-1': string;
};
export declare function staticRoles(context: any): {
    unAuthRoleName: any;
    authRoleName: any;
    unAuthRoleArn: any;
    authRoleArn: any;
};
export declare function getLambdaFunctions(context: any): Promise<any[]>;
export declare function getPollyVoices(context: any): Promise<any>;
export declare function getDynamoDBTables(context: any): Promise<{
    Name: any;
    Arn: any;
    Region: any;
    KeySchema: any;
    AttributeDefinitions: any;
}[]>;
export declare function getAppSyncAPIs(context: any): any;
export declare function getGraphQLAPIs(context: any): any;
export declare function getIntrospectionSchema(context: any, options: any): any;
export declare function getGraphQLApiDetails(context: any, options: any): any;
export declare function getBuiltInSlotTypes(context: any, options: any): any;
export declare function getSlotTypes(context: any): any;
export declare function getAppSyncApiKeys(context: any, options: any): any;
export declare function getGraphQLApiKeys(context: any, options: any): any;
export declare function getEndpoints(context: any): Promise<any>;
export declare function describeEcrRepositories(context: any, options: any): Promise<any[]>;
export declare function retrieveAwsConfig(context: any): Promise<import("./utils/auth-types").AwsSdkConfig>;
//# sourceMappingURL=utility-functions.d.ts.map