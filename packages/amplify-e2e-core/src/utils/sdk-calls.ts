/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable jsdoc/require-jsdoc */
/* eslint-disable no-return-await */
import {
  config,
  DynamoDB,
  S3,
  CognitoIdentityServiceProvider,
  Lambda,
  LexModelBuildingService,
  Rekognition,
  AppSync,
  CloudWatchLogs,
  CloudWatchEvents,
  Kinesis,
  CloudFormation,
  AmplifyBackend,
  IAM,
  SSM,
  Location,
} from 'aws-sdk';
import * as path from 'path';
import _ from 'lodash';
import { $TSAny } from 'amplify-cli-core';
import { getProjectMeta } from './projectMeta';

export const getDDBTable = async (tableName: string, region: string) => {
  const service = new DynamoDB({ region });
  if (tableName) {
    return await service.describeTable({ TableName: tableName }).promise();
  }
  return undefined;
};

export const checkIfBucketExists = async (bucketName: string, region: string) => {
  const service = new S3({ region });
  return await service.headBucket({ Bucket: bucketName }).promise();
};

export const bucketNotExists = async (bucket: string) => {
  const s3 = new S3();
  const params = {
    Bucket: bucket,
    $waiter: { maxAttempts: 10, delay: 30 },
  };
  try {
    await s3.waitFor('bucketNotExists', params).promise();
    return true;
  } catch (error) {
    if (error.statusCode === 200) {
      return false;
    }
    throw error;
  }
};

export const getBucketEncryption = async (bucket: string) => {
  const s3 = new S3();
  const params = {
    Bucket: bucket,
  };
  try {
    const result = await s3.getBucketEncryption(params).promise();
    return result.ServerSideEncryptionConfiguration;
  } catch (err) {
    throw new Error(`Error fetching SSE info for bucket ${bucket}. Underlying error was [${err.message}]`);
  }
};

export const getBucketKeys = async (params: S3.ListObjectsRequest) => {
  const s3 = new S3();

  try {
    const result = await s3.listObjects(params).promise();
    return result.Contents.map(contentObj => contentObj.Key);
  } catch (err) {
    throw new Error(`Error fetching keys for bucket ${params.Bucket}. Underlying error was [${err.message}]`);
  }
};

export const getDeploymentBucketObject = async (projectRoot: string, objectKey: string) => {
  const meta = getProjectMeta(projectRoot);
  const deploymentBucket = meta.providers.awscloudformation.DeploymentBucketName;
  const s3 = new S3();
  const result = await s3.getObject({
    Bucket: deploymentBucket,
    Key: objectKey,
  }).promise();
  return result.Body.toLocaleString();
};

export const deleteS3Bucket = async (bucket: string, providedS3Client: S3 | undefined = undefined) => {
  const s3 = providedS3Client || new S3();
  let continuationToken: Required<Pick<S3.ListObjectVersionsOutput, 'KeyMarker' | 'VersionIdMarker'>>;
  const objectKeyAndVersion = <S3.ObjectIdentifier[]>[];
  let truncated = false;
  do {
    const results = await s3
      .listObjectVersions({
        Bucket: bucket,
        ...continuationToken,
      })
      .promise();

    results.Versions?.forEach(({ Key, VersionId }) => {
      objectKeyAndVersion.push({ Key, VersionId });
    });

    results.DeleteMarkers?.forEach(({ Key, VersionId }) => {
      objectKeyAndVersion.push({ Key, VersionId });
    });

    continuationToken = { KeyMarker: results.NextKeyMarker, VersionIdMarker: results.NextVersionIdMarker };
    truncated = results.IsTruncated;
  } while (truncated);
  const chunkedResult = _.chunk(objectKeyAndVersion, 1000);
  const deleteReq = chunkedResult
    .map(r => ({
      Bucket: bucket,
      Delete: {
        Objects: r,
        Quiet: true,
      },
    }))
    .map(delParams => s3.deleteObjects(delParams).promise());
  await Promise.all(deleteReq);
  await s3
    .deleteBucket({
      Bucket: bucket,
    })
    .promise();
  await bucketNotExists(bucket);
};

export const getUserPool = async (userpoolId, region) => {
  config.update({ region });
  let res;
  try {
    res = await new CognitoIdentityServiceProvider().describeUserPool({ UserPoolId: userpoolId }).promise();
  } catch (e) {
    console.log(e);
  }
  return res;
};

export const getMFAConfiguration = async (
  userPoolId: string,
  region: string,
): Promise<CognitoIdentityServiceProvider.GetUserPoolMfaConfigResponse> => {
  config.update({ region });
  return await new CognitoIdentityServiceProvider().getUserPoolMfaConfig({ UserPoolId: userPoolId }).promise();
};

export const getLambdaFunction = async (functionName: string, region: string) => {
  const lambda = new Lambda({ region });
  try {
    return await lambda.getFunction({ FunctionName: functionName }).promise();
  } catch (e) {
    console.log(e);
  }
  return undefined;
};

export const getUserPoolClients = async (userPoolId: string, clientIds: string[], region: string) => {
  const provider = new CognitoIdentityServiceProvider({ region });
  const res = [];
  try {
    for (let i = 0; i < clientIds.length; i++) {
      const clientData = await provider
        .describeUserPoolClient({
          UserPoolId: userPoolId,
          ClientId: clientIds[i],
        })
        .promise();
      res.push(clientData);
    }
  } catch (e) {
    console.log(e);
  }
  return res;
};

export const addUserToUserPool = async (userPoolId: string, region: string) => {
  const provider = new CognitoIdentityServiceProvider({ region });
  const params = {
    UserPoolId: userPoolId,
    UserAttributes: [{ Name: 'email', Value: 'username@amazon.com' }],
    Username: 'testUser',
    MessageAction: 'SUPPRESS',
    TemporaryPassword: 'password',
  };
  await provider.adminCreateUser(params).promise();
};

/**
 * list all userPool groups to which a user belongs to
 */
export const listUserPoolGroupsForUser = async (userPoolId: string, userName: string, region: string): Promise<string[]> => {
  const provider = new CognitoIdentityServiceProvider({ region });
  const params = {
    UserPoolId: userPoolId, /* required */
    Username: userName, /* required */
  };
  const res = await provider.adminListGroupsForUser(params).promise();
  const groups = res.Groups.map(group => group.GroupName);
  return groups;
};

export const getBot = async (botName: string, region: string) => {
  const service = new LexModelBuildingService({ region });
  return await service.getBot({ name: botName, versionOrAlias: '$LATEST' }).promise();
};

export const getFunction = async (functionName: string, region: string) => {
  const service = new Lambda({ region });
  return await service.getFunction({ FunctionName: functionName }).promise();
};

export const getLayerVersion = async (functionArn: string, region: string) => {
  const service = new Lambda({ region });
  return await service.getLayerVersionByArn({ Arn: functionArn }).promise();
};

export const listVersions = async (layerName: string, region: string) => {
  const service = new Lambda({ region });
  return await service.listLayerVersions({ LayerName: layerName }).promise();
};

export const invokeFunction = async (functionName: string, payload: string, region: string) => {
  const service = new Lambda({ region });
  return await service.invoke({ FunctionName: functionName, Payload: payload }).promise();
};

export const getCollection = async (collectionId: string, region: string) => {
  const service = new Rekognition({ region });
  return await service.describeCollection({ CollectionId: collectionId }).promise();
};

export const getTable = async (tableName: string, region: string) => {
  const service = new DynamoDB({ region });
  return await service.describeTable({ TableName: tableName }).promise();
};

export const getEventSourceMappings = async (functionName: string, region: string) => {
  const service = new Lambda({ region });
  return (await service.listEventSourceMappings({ FunctionName: functionName }).promise()).EventSourceMappings;
};

export const deleteTable = async (tableName: string, region: string) => {
  const service = new DynamoDB({ region });
  return await service.deleteTable({ TableName: tableName }).promise();
};

export const putItemInTable = async (tableName: string, region: string, item: unknown) => {
  const ddb = new DynamoDB.DocumentClient({ region });
  return await ddb.put({ TableName: tableName, Item: item }).promise();
};

export const scanTable = async (tableName: string, region: string) => {
  const ddb = new DynamoDB.DocumentClient({ region });
  return await ddb.scan({ TableName: tableName }).promise();
};

export const getAppSyncApi = async (appSyncApiId: string, region: string) => {
  const service = new AppSync({ region });
  return await service.getGraphqlApi({ apiId: appSyncApiId }).promise();
};

export const getCloudWatchLogs = async (region: string, logGroupName: string, logStreamName: string | undefined = undefined) => {
  const cloudWatchLogsClient = new CloudWatchLogs({ region, retryDelayOptions: { base: 500 } });

  let targetStreamName = logStreamName;
  if (targetStreamName === undefined) {
    const describeStreamsResp = await cloudWatchLogsClient
      .describeLogStreams({ logGroupName, descending: true, orderBy: 'LastEventTime' })
      .promise();
    if (describeStreamsResp.logStreams === undefined || describeStreamsResp.logStreams.length === 0) {
      return [];
    }

    targetStreamName = describeStreamsResp.logStreams[0].logStreamName;
  }

  const logsResp = await cloudWatchLogsClient.getLogEvents({ logGroupName, logStreamName: targetStreamName }).promise();
  return logsResp.events || [];
};

export const describeCloudFormationStack = async (stackName: string, region: string, profileConfig?: $TSAny) => {
  const service = profileConfig ? new CloudFormation(profileConfig) : new CloudFormation({ region });
  return (await service.describeStacks({ StackName: stackName }).promise()).Stacks.find(
    stack => stack.StackName === stackName || stack.StackId === stackName,
  );
};

export const getNestedStackID = async (stackName: string, region: string, logicalId: string): Promise<string> => {
  const cfnClient = new CloudFormation({ region });
  const resource = await cfnClient.describeStackResources({ StackName: stackName, LogicalResourceId: logicalId }).promise();
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
  const cfnClient = new CloudFormation({ region });
  const apiResources = await cfnClient
    .describeStackResources({
      StackName: StackId,
    })
    .promise();
  const resource = apiResources.StackResources.find(stackResource => table === stackResource.LogicalResourceId);
  if (resource) {
    const tableStack = await cfnClient.describeStacks({ StackName: resource.PhysicalResourceId }).promise();
    if (tableStack?.Stacks?.length > 0) {
      const tableName = tableStack.Stacks[0].Outputs.find(out => out.OutputKey === `GetAtt${resource.LogicalResourceId}TableName`);
      return tableName.OutputValue;
    }
  }
  return null;
};

export const putKinesisRecords = async (data: string, partitionKey: string, streamName: string, region: string) => {
  const kinesis = new Kinesis({ region });

  return await kinesis
    .putRecords({
      Records: [
        {
          Data: data,
          PartitionKey: partitionKey,
        },
      ],
      StreamName: streamName,
    })
    .promise();
};

export const getCloudWatchEventRule = async (targetName: string, region: string) => {
  config.update({ region });
  const service = new CloudWatchEvents();
  const params = {
    TargetArn: targetName /* required */,
  };
  let ruleName;
  try {
    ruleName = await service.listRuleNamesByTarget(params).promise();
  } catch (e) {
    console.log(e);
  }
  return ruleName;
};

export const setupAmplifyAdminUI = async (appId: string, region: string) => {
  const amplifyBackend = new AmplifyBackend({ region });

  return await amplifyBackend.createBackendConfig({ AppId: appId }).promise();
};

export const getAmplifyBackendJobStatus = async (jobId: string, appId: string, envName: string, region: string) => {
  const amplifyBackend = new AmplifyBackend({ region });

  return await amplifyBackend
    .getBackendJob({
      JobId: jobId,
      AppId: appId,
      BackendEnvironmentName: envName,
    })
    .promise();
};

export const listRolePolicies = async (roleName: string, region: string) => {
  const service = new IAM({ region });
  return (await service.listRolePolicies({ RoleName: roleName }).promise()).PolicyNames;
};

export const listAttachedRolePolicies = async (roleName: string, region: string) => {
  const service = new IAM({ region });
  return (await service.listAttachedRolePolicies({ RoleName: roleName }).promise()).AttachedPolicies;
};

export const getPermissionsBoundary = async (roleName: string, region) => {
  const iamClient = new IAM({ region });
  return (await iamClient.getRole({ RoleName: roleName }).promise())?.Role?.PermissionsBoundary?.PermissionsBoundaryArn;
};

export const getSSMParameters = async (region: string, appId: string, envName: string, funcName: string, parameterNames: string[]) => {
  const ssmClient = new SSM({ region });
  if (!parameterNames || parameterNames.length === 0) {
    throw new Error('no parameterNames specified');
  }
  return await ssmClient
    .getParameters({
      Names: parameterNames.map(name => path.posix.join('/amplify', appId, envName, `AMPLIFY_${funcName}_${name}`)),
      WithDecryption: true,
    })
    .promise();
};

// Amazon location service calls
export const getMap = async (mapName: string, region: string) => {
  const service = new Location({ region });
  return await service.describeMap({
    MapName: mapName,
  }).promise();
};

export const getPlaceIndex = async (placeIndexName: string, region: string) => {
  const service = new Location({ region });
  return await service.describePlaceIndex({
    IndexName: placeIndexName,
  }).promise();
};

export const getGeofenceCollection = async (geofenceCollectionName: string, region: string) => {
  const service = new Location({ region });
  return await service.describeGeofenceCollection({
    CollectionName: geofenceCollectionName,
  }).promise();
};

export const getGeofence = async (geofenceCollectionName: string, geofenceId: string, region: string) => {
  const service = new Location({ region });
  return (await service.getGeofence({
    CollectionName: geofenceCollectionName,
    GeofenceId: geofenceId,
  })).promise();
};

// eslint-disable-next-line spellcheck/spell-checker
export const listGeofences = async (geofenceCollectionName: string, region: string, nextToken: string = null) => {
  const service = new Location({ region });
  // eslint-disable-next-line spellcheck/spell-checker
  return (await service.listGeofences({
    CollectionName: geofenceCollectionName,
    NextToken: nextToken,
  })).promise();
};
