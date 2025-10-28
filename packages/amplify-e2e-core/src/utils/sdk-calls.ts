/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable no-return-await */
import { DynamoDBClient, DescribeTableCommand, DeleteTableCommand } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import {
  S3Client,
  HeadBucketCommand,
  GetBucketEncryptionCommand,
  ListObjectsCommand,
  GetObjectCommand,
  ListObjectVersionsCommand,
  DeleteObjectsCommand,
  DeleteBucketCommand,
  waitUntilBucketNotExists,
  ObjectIdentifier,
} from '@aws-sdk/client-s3';
import { CognitoIdentityClient, GetIdentityPoolRolesCommand } from '@aws-sdk/client-cognito-identity';
import {
  CognitoIdentityProviderClient,
  DescribeUserPoolCommand,
  DeleteUserPoolDomainCommand,
  DeleteIdentityProviderCommand,
  ListIdentityProvidersCommand,
  DescribeIdentityProviderCommand,
  DescribeUserPoolDomainCommand,
  ListUserPoolsCommand,
  GetUserPoolMfaConfigCommand,
  DescribeUserPoolClientCommand,
  AdminCreateUserCommand,
  ListUsersCommand,
  AdminListGroupsForUserCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import {
  LambdaClient,
  GetFunctionCommand,
  GetLayerVersionByArnCommand,
  ListLayerVersionsCommand,
  InvokeCommand,
  ListEventSourceMappingsCommand,
} from '@aws-sdk/client-lambda';
import { LexModelBuildingServiceClient, GetBotCommand } from '@aws-sdk/client-lex-model-building-service';
import { RekognitionClient, DescribeCollectionCommand } from '@aws-sdk/client-rekognition';
import { AppSyncClient, GetGraphqlApiCommand } from '@aws-sdk/client-appsync';
import { CloudWatchLogsClient, DescribeLogStreamsCommand, GetLogEventsCommand } from '@aws-sdk/client-cloudwatch-logs';
import { CloudWatchEventsClient, ListRuleNamesByTargetCommand } from '@aws-sdk/client-cloudwatch-events';
import { KinesisClient, PutRecordsCommand } from '@aws-sdk/client-kinesis';
import { CloudFormationClient, DescribeStacksCommand, DescribeStackResourcesCommand } from '@aws-sdk/client-cloudformation';
import { AmplifyBackendClient, CreateBackendConfigCommand, GetBackendJobCommand } from '@aws-sdk/client-amplifybackend';
import { IAMClient, ListRolePoliciesCommand, ListAttachedRolePoliciesCommand, GetRoleCommand } from '@aws-sdk/client-iam';
import { SSMClient, GetParametersCommand, DeleteParameterCommand, GetParametersByPathCommand } from '@aws-sdk/client-ssm';
import {
  LocationClient,
  DescribeMapCommand,
  DescribePlaceIndexCommand,
  DescribeGeofenceCollectionCommand,
  GetGeofenceCommand,
  ListGeofencesCommand,
} from '@aws-sdk/client-location';
import * as path from 'path';
import _ from 'lodash';
import { $TSAny } from '@aws-amplify/amplify-cli-core';
import { getProjectMeta } from './projectMeta';

export const getDDBTable = async (tableName: string, region: string) => {
  const service = new DynamoDBClient({ region });
  if (tableName) {
    const command = new DescribeTableCommand({ TableName: tableName });
    return await service.send(command);
  }
  return undefined;
};

export const checkIfBucketExists = async (bucketName: string, region: string) => {
  const service = new S3Client({ region });
  const command = new HeadBucketCommand({ Bucket: bucketName });
  return await service.send(command);
};

export const bucketNotExists = async (bucket: string) => {
  const s3 = new S3Client({});
  try {
    await waitUntilBucketNotExists({ client: s3, maxWaitTime: 300 }, { Bucket: bucket });
    return true;
  } catch (error) {
    if (error.$metadata.httpStatusCode === 200) {
      return false;
    }
    throw error;
  }
};

export const getBucketEncryption = async (bucket: string) => {
  const s3 = new S3Client({});
  const command = new GetBucketEncryptionCommand({ Bucket: bucket });
  try {
    const result = await s3.send(command);
    return result.ServerSideEncryptionConfiguration;
  } catch (err) {
    throw new Error(`Error fetching SSE info for bucket ${bucket}. Underlying error was [${err.message}]`);
  }
};

export const getBucketKeys = async (params: { Bucket: string; Prefix?: string; Marker?: string; MaxKeys?: number }) => {
  const s3 = new S3Client({});
  const command = new ListObjectsCommand(params);

  try {
    const result = await s3.send(command);
    return result.Contents?.map((contentObj) => contentObj.Key);
  } catch (err) {
    throw new Error(`Error fetching keys for bucket ${params.Bucket}. Underlying error was [${err.message}]`);
  }
};

export const getDeploymentBucketObject = async (projectRoot: string, objectKey: string) => {
  const meta = getProjectMeta(projectRoot);
  const deploymentBucket = meta.providers.awscloudformation.DeploymentBucketName;
  const s3 = new S3Client({});
  const command = new GetObjectCommand({
    Bucket: deploymentBucket,
    Key: objectKey,
  });
  const result = await s3.send(command);
  return result.Body?.transformToString();
};

export const deleteS3Bucket = async (bucket: string, providedS3Client: S3Client | undefined = undefined) => {
  const s3 = providedS3Client || new S3Client({});
  let continuationToken: { KeyMarker?: string; VersionIdMarker?: string } = {};
  const objectKeyAndVersion: { Key?: string; VersionId?: string }[] = [];
  let truncated = false;

  do {
    const command = new ListObjectVersionsCommand({
      Bucket: bucket,
      ...continuationToken,
    });
    const results = await s3.send(command);

    results.Versions?.forEach(({ Key, VersionId }) => {
      objectKeyAndVersion.push({ Key, VersionId });
    });

    results.DeleteMarkers?.forEach(({ Key, VersionId }) => {
      objectKeyAndVersion.push({ Key, VersionId });
    });

    continuationToken = {
      KeyMarker: results.NextKeyMarker,
      VersionIdMarker: results.NextVersionIdMarker,
    };
    truncated = results.IsTruncated;
  } while (truncated);

  const chunkedResult = _.chunk(objectKeyAndVersion, 1000);
  const deleteReq = chunkedResult
    .map(
      (r) =>
        new DeleteObjectsCommand({
          Bucket: bucket,
          Delete: {
            Objects: r as ObjectIdentifier[],
            Quiet: true,
          },
        }),
    )
    .map((delCommand) => s3.send(delCommand));

  await Promise.all(deleteReq);

  const deleteBucketCommand = new DeleteBucketCommand({ Bucket: bucket });
  await s3.send(deleteBucketCommand);
  await bucketNotExists(bucket);
};

export const getUserPool = async (userpoolId, region) => {
  let res;
  try {
    const client = new CognitoIdentityProviderClient({ region });
    const command = new DescribeUserPoolCommand({ UserPoolId: userpoolId });
    res = await client.send(command);
  } catch (e) {
    console.log(e);
  }
  return res;
};

export const deleteUserPoolDomain = async (domain: string, userpoolId: string, region: string) => {
  let res;
  try {
    const client = new CognitoIdentityProviderClient({ region });
    const command = new DeleteUserPoolDomainCommand({ Domain: domain, UserPoolId: userpoolId });
    res = await client.send(command);
  } catch (e) {
    console.log(e);
  }
  return res;
};

export const deleteSocialIdpProviders = async (providers: string[], userpoolId: string, region: string) => {
  const client = new CognitoIdentityProviderClient({ region });
  for (const provider of providers) {
    try {
      const command = new DeleteIdentityProviderCommand({
        ProviderName: provider,
        UserPoolId: userpoolId,
      });
      await client.send(command);
    } catch (err) {
      console.log(err);
    }
  }
};

export const listSocialIdpProviders = async (userpoolId: string, region: string) => {
  let res;
  try {
    const client = new CognitoIdentityProviderClient({ region });
    const command = new ListIdentityProvidersCommand({ UserPoolId: userpoolId });
    res = await client.send(command);
  } catch (err) {
    console.log(err);
  }
  return res;
};

export const getSocialIdpProvider = async (
  userpoolId: string,
  providerName: 'Facebook' | 'Google' | 'LoginWithAmazon' | 'SignInWithApple',
  region: string,
) => {
  let res;
  try {
    const client = new CognitoIdentityProviderClient({ region });
    const command = new DescribeIdentityProviderCommand({
      UserPoolId: userpoolId,
      ProviderName: providerName,
    });
    res = await client.send(command);
  } catch (err) {
    console.log(err);
  }
  return res;
};

export const getUserPoolDomain = async (domain: string, region: string) => {
  let res;
  try {
    const client = new CognitoIdentityProviderClient({ region });
    const command = new DescribeUserPoolDomainCommand({ Domain: domain });
    res = await client.send(command);
  } catch (err) {
    console.log(err);
  }
  return res;
};

export const getIdentityPoolRoles = async (identityPoolId: string, region: string) => {
  let res;

  try {
    const client = new CognitoIdentityClient({ region });
    const command = new GetIdentityPoolRolesCommand({ IdentityPoolId: identityPoolId });
    res = await client.send(command);
  } catch (e) {
    console.log(e);
  }

  return res;
};

export const listUserPools = async (region, maxResults = 5) => {
  let res;
  try {
    const client = new CognitoIdentityProviderClient({ region });
    const command = new ListUserPoolsCommand({ MaxResults: maxResults });
    res = await client.send(command);
  } catch (e) {
    console.log(e);
  }
  return res?.UserPools ?? [];
};

export const getMFAConfiguration = async (userPoolId: string, region: string) => {
  const client = new CognitoIdentityProviderClient({ region });
  const command = new GetUserPoolMfaConfigCommand({ UserPoolId: userPoolId });
  return await client.send(command);
};

export const getLambdaFunction = async (functionName: string, region: string) => {
  const client = new LambdaClient({ region });
  try {
    const command = new GetFunctionCommand({ FunctionName: functionName });
    return await client.send(command);
  } catch (e) {
    console.log(e);
  }
  return undefined;
};

export const getUserPoolClients = async (userPoolId: string, clientIds: string[], region: string) => {
  const provider = new CognitoIdentityProviderClient({ region });
  const res = [];
  try {
    for (let i = 0; i < clientIds.length; i++) {
      const command = new DescribeUserPoolClientCommand({
        UserPoolId: userPoolId,
        ClientId: clientIds[i],
      });
      const clientData = await provider.send(command);
      res.push(clientData);
    }
  } catch (e) {
    console.log(e);
  }
  return res;
};

export const addUserToUserPool = async (userPoolId: string, region: string) => {
  const provider = new CognitoIdentityProviderClient({ region });
  const command = new AdminCreateUserCommand({
    UserPoolId: userPoolId,
    UserAttributes: [{ Name: 'email', Value: 'username@amazon.com' }],
    Username: 'testUser',
    MessageAction: 'SUPPRESS',
    TemporaryPassword: 'password',
  });
  await provider.send(command);
};

/**
 * list all users in a Cognito user pool
 */
export const listUsersInUserPool = async (userPoolId: string, region: string): Promise<string[]> => {
  const provider = new CognitoIdentityProviderClient({ region });
  const command = new ListUsersCommand({ UserPoolId: userPoolId });
  const result = await provider.send(command);
  return result.Users?.map((u) => u.Username) || [];
};

/**
 * list all userPool groups to which a user belongs to
 */
export const listUserPoolGroupsForUser = async (userPoolId: string, userName: string, region: string): Promise<string[]> => {
  const provider = new CognitoIdentityProviderClient({ region });
  const command = new AdminListGroupsForUserCommand({
    UserPoolId: userPoolId,
    Username: userName,
  });
  const res = await provider.send(command);
  const groups = res.Groups?.map((group) => group.GroupName) || [];
  return groups;
};

export const getBot = async (botName: string, region: string) => {
  const service = new LexModelBuildingServiceClient({ region });
  const command = new GetBotCommand({ name: botName, versionOrAlias: '$LATEST' });
  return await service.send(command);
};

export const getFunction = async (functionName: string, region: string) => {
  const service = new LambdaClient({ region });
  const command = new GetFunctionCommand({ FunctionName: functionName });
  return await service.send(command);
};

export const getLayerVersion = async (functionArn: string, region: string) => {
  const service = new LambdaClient({ region });
  const command = new GetLayerVersionByArnCommand({ Arn: functionArn });
  return await service.send(command);
};

export const listVersions = async (layerName: string, region: string) => {
  const service = new LambdaClient({ region });
  const command = new ListLayerVersionsCommand({ LayerName: layerName });
  return await service.send(command);
};

export const invokeFunction = async (functionName: string, payload: string, region: string) => {
  const service = new LambdaClient({ region });
  const command = new InvokeCommand({ FunctionName: functionName, Payload: payload });
  return await service.send(command);
};

export const getCollection = async (collectionId: string, region: string) => {
  const service = new RekognitionClient({ region });
  const command = new DescribeCollectionCommand({ CollectionId: collectionId });
  return await service.send(command);
};

export const getTable = async (tableName: string, region: string) => {
  const service = new DynamoDBClient({ region });
  const command = new DescribeTableCommand({ TableName: tableName });
  return await service.send(command);
};

export const getEventSourceMappings = async (functionName: string, region: string) => {
  const service = new LambdaClient({ region });
  const command = new ListEventSourceMappingsCommand({ FunctionName: functionName });
  const result = await service.send(command);
  return result.EventSourceMappings || [];
};

export const deleteTable = async (tableName: string, region: string) => {
  const service = new DynamoDBClient({ region });
  const command = new DeleteTableCommand({ TableName: tableName });
  return await service.send(command);
};

export const putItemInTable = async (tableName: string, region: string, item: unknown) => {
  const ddb = new DynamoDBClient({ region });
  const docClient = DynamoDBDocumentClient.from(ddb);
  const command = new PutCommand({ TableName: tableName, Item: item });
  return await docClient.send(command);
};

export const scanTable = async (tableName: string, region: string) => {
  const ddb = new DynamoDBClient({ region });
  const docClient = DynamoDBDocumentClient.from(ddb);
  const command = new ScanCommand({ TableName: tableName });
  return await docClient.send(command);
};

export const getAppSyncApi = async (appSyncApiId: string, region: string) => {
  const service = new AppSyncClient({ region });
  const command = new GetGraphqlApiCommand({ apiId: appSyncApiId });
  return await service.send(command);
};

export const getCloudWatchLogs = async (region: string, logGroupName: string, logStreamName: string | undefined = undefined) => {
  const cloudWatchLogsClient = new CloudWatchLogsClient({ region, retryMode: 'standard' });

  let targetStreamName = logStreamName;
  if (targetStreamName === undefined) {
    const describeCommand = new DescribeLogStreamsCommand({
      logGroupName,
      descending: true,
      orderBy: 'LastEventTime',
    });
    const describeStreamsResp = await cloudWatchLogsClient.send(describeCommand);
    if (describeStreamsResp.logStreams === undefined || describeStreamsResp.logStreams.length === 0) {
      return [];
    }

    targetStreamName = describeStreamsResp.logStreams[0].logStreamName;
  }

  const getLogsCommand = new GetLogEventsCommand({
    logGroupName,
    logStreamName: targetStreamName,
  });
  const logsResp = await cloudWatchLogsClient.send(getLogsCommand);
  return logsResp.events || [];
};

export const describeCloudFormationStack = async (stackName: string, region: string, profileConfig?: $TSAny) => {
  const clientConfig = profileConfig ? profileConfig : { region };
  const client = new CloudFormationClient(clientConfig);
  const command = new DescribeStacksCommand({ StackName: stackName });
  const result = await client.send(command);
  return result.Stacks?.find((stack) => stack.StackName === stackName || stack.StackId === stackName);
};

export const getNestedStackID = async (stackName: string, region: string, logicalId: string): Promise<string> => {
  const cfnClient = new CloudFormationClient({ region });
  const command = new DescribeStackResourcesCommand({
    StackName: stackName,
    LogicalResourceId: logicalId,
  });
  const resource = await cfnClient.send(command);
  return resource?.StackResources?.[0].PhysicalResourceId ?? null;
};

/**
 * Collects table resource id from parent stack
 * @param region region the stack exists in
 * @param table name of the table used in the appsync schema
 * @param StackId id of the parent stack
 * @returns
 */

export const getTableResourceId = async (region: string, table: string, StackId: string): Promise<string | null> => {
  const cfnClient = new CloudFormationClient({ region });
  const resourcesCommand = new DescribeStackResourcesCommand({ StackName: StackId });
  const apiResources = await cfnClient.send(resourcesCommand);

  const resource = apiResources.StackResources?.find((stackResource) => table === stackResource.LogicalResourceId);
  if (resource) {
    const stackCommand = new DescribeStacksCommand({ StackName: resource.PhysicalResourceId });
    const tableStack = await cfnClient.send(stackCommand);
    if (tableStack?.Stacks?.length > 0) {
      const tableName = tableStack.Stacks[0].Outputs?.find((out) => out.OutputKey === `GetAtt${resource.LogicalResourceId}TableName`);
      return tableName?.OutputValue || null;
    }
  }
  return null;
};

export const putKinesisRecords = async (data: string, partitionKey: string, streamName: string, region: string) => {
  const kinesis = new KinesisClient({ region });
  const command = new PutRecordsCommand({
    Records: [
      {
        Data: new TextEncoder().encode(data),
        PartitionKey: partitionKey,
      },
    ],
    StreamName: streamName,
  });

  return await kinesis.send(command);
};

export const getCloudWatchEventRule = async (targetName: string, region: string) => {
  const service = new CloudWatchEventsClient({ region });
  const command = new ListRuleNamesByTargetCommand({ TargetArn: targetName });
  let ruleName;
  try {
    ruleName = await service.send(command);
  } catch (e) {
    console.log(e);
  }
  return ruleName;
};

export const setupAmplifyAdminUI = async (appId: string, region: string) => {
  const amplifyBackend = new AmplifyBackendClient({ region });
  const command = new CreateBackendConfigCommand({ AppId: appId });
  return await amplifyBackend.send(command);
};

export const getAmplifyBackendJobStatus = async (jobId: string, appId: string, envName: string, region: string) => {
  const amplifyBackend = new AmplifyBackendClient({ region });
  const command = new GetBackendJobCommand({
    JobId: jobId,
    AppId: appId,
    BackendEnvironmentName: envName,
  });
  return await amplifyBackend.send(command);
};

export const listRolePolicies = async (roleName: string, region: string) => {
  const service = new IAMClient({ region });
  const command = new ListRolePoliciesCommand({ RoleName: roleName });
  const result = await service.send(command);
  return result.PolicyNames || [];
};

export const listAttachedRolePolicies = async (roleName: string, region: string) => {
  const service = new IAMClient({ region });
  const command = new ListAttachedRolePoliciesCommand({ RoleName: roleName });
  const result = await service.send(command);
  return result.AttachedPolicies || [];
};

export const getPermissionsBoundary = async (roleName: string, region) => {
  const iamClient = new IAMClient({ region });
  const command = new GetRoleCommand({ RoleName: roleName });
  const result = await iamClient.send(command);
  return result?.Role?.PermissionsBoundary?.PermissionsBoundaryArn;
};

export const getSSMParameters = async (region: string, appId: string, envName: string, funcName: string, parameterNames: string[]) => {
  const ssmClient = new SSMClient({ region });
  if (!parameterNames || parameterNames.length === 0) {
    throw new Error('no parameterNames specified');
  }
  const command = new GetParametersCommand({
    Names: parameterNames.map((name) => path.posix.join('/amplify', appId, envName, `AMPLIFY_${funcName}_${name}`)),
    WithDecryption: true,
  });
  return await ssmClient.send(command);
};

export const deleteSSMParameter = async (
  region: string,
  appId: string,
  envName: string,
  category: string,
  funcName: string,
  parameterName: string,
) => {
  const ssmClient = new SSMClient({ region });
  const command = new DeleteParameterCommand({
    Name: path.posix.join('/amplify', appId, envName, `AMPLIFY_${category}_${funcName}_${parameterName}`),
  });
  return await ssmClient.send(command);
};

export const getSSMParametersCategoryPrefix = async (
  region: string,
  appId: string,
  envName: string,
  category: string,
  resourceName: string,
  parameterNames: string[],
) => {
  const ssmClient = new SSMClient({ region });
  if (!parameterNames || parameterNames.length === 0) {
    throw new Error('no parameterNames specified');
  }
  const command = new GetParametersCommand({
    Names: parameterNames.map((name) => `/amplify/${appId}/${envName}/AMPLIFY_${category}_${resourceName}_${name}`),
  });
  return ssmClient.send(command);
};

export const getAllSSMParamatersForAppId = async (appId: string, region: string): Promise<Array<string>> => {
  const ssmClient = new SSMClient({ region });
  const retrievedParameters: Array<string> = [];
  let receivedNextToken = '';
  do {
    const ssmArgument = getSsmSdkParametersByPath(appId, receivedNextToken);
    const command = new GetParametersByPathCommand(ssmArgument);
    const data = await ssmClient.send(command);
    retrievedParameters.push(...(data.Parameters?.map((returnedParameter) => returnedParameter.Name) || []));
    receivedNextToken = data.NextToken;
  } while (receivedNextToken);
  return retrievedParameters;
};

export const expectParametersOptionalValue = async (
  expectToExist: NameOptionalValuePair[],
  expectNotExist: string[],
  region: string,
  appId: string,
  envName: string,
  category: string,
  resourceName: string,
): Promise<void> => {
  const parametersToRequest = expectToExist.map((exist) => exist.name).concat(expectNotExist);
  const result = await getSSMParametersCategoryPrefix(region, appId, envName, category, resourceName, parametersToRequest);
  const mapName = (name: string) => `/amplify/${appId}/${envName}/AMPLIFY_${category}_${resourceName}_${name}`;
  expect(result.InvalidParameters?.length || 0).toBe(expectNotExist.length);
  expect(result.InvalidParameters.sort()).toEqual(expectNotExist.map(mapName).sort());
  expect(result.Parameters?.length || 0).toBe(expectToExist.length);
  const mappedResult = result.Parameters.map((param) => ({ name: param.Name, value: JSON.parse(param.Value) })).sort(sortByName);
  const mappedExpect = expectToExist
    .map((exist) => ({ name: mapName(exist.name), value: exist.value ? exist.value : '' }))
    .sort(sortByName);

  const mappedResultKeys = mappedResult.map((parameter) => parameter.name);
  for (const expectedParam of mappedExpect) {
    if (expectedParam.value) {
      expect(mappedResult).toContainEqual(expectedParam);
    } else {
      expect(mappedResultKeys).toContainEqual(expectedParam.name);
    }
  }
};

const sortByName = (a: NameOptionalValuePair, b: NameOptionalValuePair) => a.name.localeCompare(b.name);
type NameOptionalValuePair = { name: string; value?: string };

const getSsmSdkParametersByPath = (appId: string, nextToken?: string): SsmGetParametersByPathArgument => {
  const sdkParameters: SsmGetParametersByPathArgument = { Path: `/amplify/${appId}/` };
  if (nextToken) {
    sdkParameters.NextToken = nextToken;
  }
  return sdkParameters;
};

type SsmGetParametersByPathArgument = {
  Path: string;
  NextToken?: string;
};

// Amazon location service calls
export const getMap = async (mapName: string, region: string) => {
  const service = new LocationClient({ region });
  const command = new DescribeMapCommand({ MapName: mapName });
  return await service.send(command);
};

export const getPlaceIndex = async (placeIndexName: string, region: string) => {
  const service = new LocationClient({ region });
  const command = new DescribePlaceIndexCommand({ IndexName: placeIndexName });
  return await service.send(command);
};

export const getGeofenceCollection = async (geofenceCollectionName: string, region: string) => {
  const service = new LocationClient({ region });
  const command = new DescribeGeofenceCollectionCommand({ CollectionName: geofenceCollectionName });
  return await service.send(command);
};

export const getGeofence = async (geofenceCollectionName: string, geofenceId: string, region: string) => {
  const service = new LocationClient({ region });
  const command = new GetGeofenceCommand({
    CollectionName: geofenceCollectionName,
    GeofenceId: geofenceId,
  });
  return await service.send(command);
};

// eslint-disable-next-line spellcheck/spell-checker
export const listGeofences = async (geofenceCollectionName: string, region: string, nextToken: string = null) => {
  const client = new LocationClient({ region });
  const command = new ListGeofencesCommand({
    CollectionName: geofenceCollectionName,
    NextToken: nextToken,
  });
  return await client.send(command);
};
