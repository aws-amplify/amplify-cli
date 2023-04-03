import { DynamoDB, S3, CognitoIdentityServiceProvider, Lambda, LexModelBuildingService, Rekognition, AppSync, CloudWatchLogs, Kinesis, CloudFormation, AmplifyBackend, IAM, SSM, Location } from 'aws-sdk';
import { $TSAny } from 'amplify-cli-core';
export declare const getDDBTable: (tableName: string, region: string) => Promise<import("aws-sdk/lib/request").PromiseResult<DynamoDB.DescribeTableOutput, import("aws-sdk").AWSError>>;
export declare const checkIfBucketExists: (bucketName: string, region: string) => Promise<{
    $response: import("aws-sdk").Response<{}, import("aws-sdk").AWSError>;
}>;
export declare const bucketNotExists: (bucket: string) => Promise<boolean>;
export declare const getBucketEncryption: (bucket: string) => Promise<S3.ServerSideEncryptionConfiguration>;
export declare const getBucketKeys: (params: S3.ListObjectsRequest) => Promise<string[]>;
export declare const getDeploymentBucketObject: (projectRoot: string, objectKey: string) => Promise<string>;
export declare const deleteS3Bucket: (bucket: string, providedS3Client?: S3 | undefined) => Promise<void>;
export declare const getUserPool: (userpoolId: any, region: any) => Promise<any>;
export declare const getMFAConfiguration: (userPoolId: string, region: string) => Promise<CognitoIdentityServiceProvider.GetUserPoolMfaConfigResponse>;
export declare const getLambdaFunction: (functionName: string, region: string) => Promise<import("aws-sdk/lib/request").PromiseResult<Lambda.GetFunctionResponse, import("aws-sdk").AWSError>>;
export declare const getUserPoolClients: (userPoolId: string, clientIds: string[], region: string) => Promise<any[]>;
export declare const addUserToUserPool: (userPoolId: string, region: string) => Promise<void>;
/**
 * list all userPool groups to which a user belongs to
 */
export declare const listUserPoolGroupsForUser: (userPoolId: string, userName: string, region: string) => Promise<string[]>;
export declare const getBot: (botName: string, region: string) => Promise<import("aws-sdk/lib/request").PromiseResult<LexModelBuildingService.GetBotResponse, import("aws-sdk").AWSError>>;
export declare const getFunction: (functionName: string, region: string) => Promise<import("aws-sdk/lib/request").PromiseResult<Lambda.GetFunctionResponse, import("aws-sdk").AWSError>>;
export declare const getLayerVersion: (functionArn: string, region: string) => Promise<import("aws-sdk/lib/request").PromiseResult<Lambda.GetLayerVersionResponse, import("aws-sdk").AWSError>>;
export declare const listVersions: (layerName: string, region: string) => Promise<import("aws-sdk/lib/request").PromiseResult<Lambda.ListLayerVersionsResponse, import("aws-sdk").AWSError>>;
export declare const invokeFunction: (functionName: string, payload: string, region: string) => Promise<import("aws-sdk/lib/request").PromiseResult<Lambda.InvocationResponse, import("aws-sdk").AWSError>>;
export declare const getCollection: (collectionId: string, region: string) => Promise<import("aws-sdk/lib/request").PromiseResult<Rekognition.DescribeCollectionResponse, import("aws-sdk").AWSError>>;
export declare const getTable: (tableName: string, region: string) => Promise<import("aws-sdk/lib/request").PromiseResult<DynamoDB.DescribeTableOutput, import("aws-sdk").AWSError>>;
export declare const getEventSourceMappings: (functionName: string, region: string) => Promise<Lambda.EventSourceMappingsList>;
export declare const deleteTable: (tableName: string, region: string) => Promise<import("aws-sdk/lib/request").PromiseResult<DynamoDB.DeleteTableOutput, import("aws-sdk").AWSError>>;
export declare const putItemInTable: (tableName: string, region: string, item: unknown) => Promise<import("aws-sdk/lib/request").PromiseResult<DynamoDB.DocumentClient.PutItemOutput, import("aws-sdk").AWSError>>;
export declare const scanTable: (tableName: string, region: string) => Promise<import("aws-sdk/lib/request").PromiseResult<DynamoDB.DocumentClient.ScanOutput, import("aws-sdk").AWSError>>;
export declare const getAppSyncApi: (appSyncApiId: string, region: string) => Promise<import("aws-sdk/lib/request").PromiseResult<AppSync.GetGraphqlApiResponse, import("aws-sdk").AWSError>>;
export declare const getCloudWatchLogs: (region: string, logGroupName: string, logStreamName?: string | undefined) => Promise<CloudWatchLogs.OutputLogEvents>;
export declare const describeCloudFormationStack: (stackName: string, region: string, profileConfig?: $TSAny) => Promise<CloudFormation.Stack>;
export declare const getNestedStackID: (stackName: string, region: string, logicalId: string) => Promise<string>;
/**
 * Collects table resource id from parent stack
 * @param region region the stack exists in
 * @param table name of the table used in the appsync schema
 * @param StackId id of the parent stack
 * @returns
 */
export declare const getTableResourceId: (region: string, table: string, StackId: string) => Promise<string | null>;
export declare const putKinesisRecords: (data: string, partitionKey: string, streamName: string, region: string) => Promise<import("aws-sdk/lib/request").PromiseResult<Kinesis.PutRecordsOutput, import("aws-sdk").AWSError>>;
export declare const getCloudWatchEventRule: (targetName: string, region: string) => Promise<any>;
export declare const setupAmplifyAdminUI: (appId: string, region: string) => Promise<import("aws-sdk/lib/request").PromiseResult<AmplifyBackend.CreateBackendConfigResponse, import("aws-sdk").AWSError>>;
export declare const getAmplifyBackendJobStatus: (jobId: string, appId: string, envName: string, region: string) => Promise<import("aws-sdk/lib/request").PromiseResult<AmplifyBackend.GetBackendJobResponse, import("aws-sdk").AWSError>>;
export declare const listRolePolicies: (roleName: string, region: string) => Promise<IAM.policyNameListType>;
export declare const listAttachedRolePolicies: (roleName: string, region: string) => Promise<IAM.attachedPoliciesListType>;
export declare const getPermissionsBoundary: (roleName: string, region: any) => Promise<string>;
export declare const getSSMParameters: (region: string, appId: string, envName: string, funcName: string, parameterNames: string[]) => Promise<import("aws-sdk/lib/request").PromiseResult<SSM.GetParametersResult, import("aws-sdk").AWSError>>;
export declare const deleteSSMParameter: (region: string, appId: string, envName: string, category: string, funcName: string, parameterName: string) => Promise<import("aws-sdk/lib/request").PromiseResult<SSM.DeleteParameterResult, import("aws-sdk").AWSError>>;
export declare const getSSMParametersCategoryPrefix: (region: string, appId: string, envName: string, category: string, resourceName: string, parameterNames: string[]) => Promise<import("aws-sdk/lib/request").PromiseResult<SSM.GetParametersResult, import("aws-sdk").AWSError>>;
export declare const getAllSSMParamatersForAppId: (appId: string, region: string) => Promise<Array<string>>;
export declare const expectParametersOptionalValue: (expectToExist: NameOptionalValuePair[], expectNotExist: string[], region: string, appId: string, envName: string, category: string, resourceName: string) => Promise<void>;
type NameOptionalValuePair = {
    name: string;
    value?: string;
};
export declare const getMap: (mapName: string, region: string) => Promise<import("aws-sdk/lib/request").PromiseResult<Location.DescribeMapResponse, import("aws-sdk").AWSError>>;
export declare const getPlaceIndex: (placeIndexName: string, region: string) => Promise<import("aws-sdk/lib/request").PromiseResult<Location.DescribePlaceIndexResponse, import("aws-sdk").AWSError>>;
export declare const getGeofenceCollection: (geofenceCollectionName: string, region: string) => Promise<import("aws-sdk/lib/request").PromiseResult<Location.DescribeGeofenceCollectionResponse, import("aws-sdk").AWSError>>;
export declare const getGeofence: (geofenceCollectionName: string, geofenceId: string, region: string) => Promise<import("aws-sdk/lib/request").PromiseResult<Location.GetGeofenceResponse, import("aws-sdk").AWSError>>;
export declare const listGeofences: (geofenceCollectionName: string, region: string, nextToken?: string) => Promise<import("aws-sdk/lib/request").PromiseResult<Location.ListGeofencesResponse, import("aws-sdk").AWSError>>;
export {};
