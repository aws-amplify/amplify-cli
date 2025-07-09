/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable no-return-await */
import {
  DynamoDB,
  S3,
  CognitoIdentity,
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
import { $TSAny } from '@aws-amplify/amplify-cli-core';
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
    return result.Contents.map((contentObj) => contentObj.Key);
  } catch (err) {
    throw new Error(`Error fetching keys for bucket ${params.Bucket}. Underlying error was [${err.message}]`);
  }
};

export const getDeploymentBucketObject = async (projectRoot: string, objectKey: string) => {
  const meta = getProjectMeta(projectRoot);
  const deploymentBucket = meta.providers.awscloudformation.DeploymentBucketName;
  const s3 = new S3();
  const result = await s3
    .getObject({
      Bucket: deploymentBucket,
      Key: objectKey,
    })
    .promise();
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
    .map((r) => ({
      Bucket: bucket,
      Delete: {
        Objects: r,
        Quiet: true,
      },
    }))
    .map((delParams) => s3.deleteObjects(delParams).promise());

  await Promise.all(deleteReq);

  await s3
    .deleteBucket({
      Bucket: bucket,
    })
    .promise();
  await bucketNotExists(bucket);
};

export const getUserPool = async (userpoolId, region) => {
  let res;
  try {
    res = await new CognitoIdentityServiceProvider({ region }).describeUserPool({ UserPoolId: userpoolId }).promise();
  } catch (e) {
    console.log(e);
  }
  return res;
};

export const deleteUserPoolDomain = async (domain: string, userpoolId: string, region: string) => {
  let res;
  try {
    res = await new CognitoIdentityServiceProvider({ region }).deleteUserPoolDomain({ Domain: domain, UserPoolId: userpoolId }).promise();
  } catch (e) {
    console.log(e);
  }
  return res;
};

export const deleteSocialIdpProviders = async (providers: string[], userpoolId: string, region: string) => {
  for (const provider of providers) {
    try {
      await new CognitoIdentityServiceProvider({ region })
        .deleteIdentityProvider({ ProviderName: provider, UserPoolId: userpoolId })
        .promise();
    } catch (err) {
      console.log(err);
    }
  }
};

export const listSocialIdpProviders = async (userpoolId: string, region: string) => {
  let res;
  try {
    res = await new CognitoIdentityServiceProvider({ region }).listIdentityProviders({ UserPoolId: userpoolId }).promise();
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
    res = await new CognitoIdentityServiceProvider({ region })
      .describeIdentityProvider({
        UserPoolId: userpoolId,
        ProviderName: providerName,
      })
      .promise();
  } catch (err) {
    console.log(err);
  }
  return res;
};

export const getUserPoolDomain = async (domain: string, region: string) => {
  let res;
  try {
    res = await new CognitoIdentityServiceProvider({ region })
      .describeUserPoolDomain({
        Domain: domain,
      })
      .promise();
  } catch (err) {
    console.log(err);
  }
  return res;
};

export const getIdentityPoolRoles = async (identityPoolId: string, region: string) => {
  let res;

  try {
    res = await new CognitoIdentity({ region }).getIdentityPoolRoles({ IdentityPoolId: identityPoolId }).promise();
  } catch (e) {
    console.log(e);
  }

  return res;
};

export const listUserPools = async (region, maxResults = 5) => {
  let res;
  try {
    res = await new CognitoIdentityServiceProvider({ region }).listUserPools({ MaxResults: maxResults }).promise();
  } catch (e) {
    console.log(e);
  }
  return res?.UserPools ?? [];
};

export const getMFAConfiguration = async (
  userPoolId: string,
  region: string,
): Promise<CognitoIdentityServiceProvider.GetUserPoolMfaConfigResponse> => {
  return await new CognitoIdentityServiceProvider({ region }).getUserPoolMfaConfig({ UserPoolId: userPoolId }).promise();
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
 * list all users in a Cognito user pool
 */
export const listUsersInUserPool = async (userPoolId: string, region: string): Promise<string[]> => {
  const provider = new CognitoIdentityServiceProvider({ region });
  const params = {
    UserPoolId: userPoolId /* required */,
  };
  const { Users } = await provider.listUsers(params).promise();
  return Users.map((u) => u.Username);
};

/**
 * list all userPool groups to which a user belongs to
 */
export const listUserPoolGroupsForUser = async (userPoolId: string, userName: string, region: string): Promise<string[]> => {
  const provider = new CognitoIdentityServiceProvider({ region });
  const params = {
    UserPoolId: userPoolId /* required */,
    Username: userName /* required */,
  };
  const res = await provider.adminListGroupsForUser(params).promise();
  const groups = res.Groups.map((group) => group.GroupName);
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
    (stack) => stack.StackName === stackName || stack.StackId === stackName,
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
  const resource = apiResources.StackResources.find((stackResource) => table === stackResource.LogicalResourceId);
  if (resource) {
    const tableStack = await cfnClient.describeStacks({ StackName: resource.PhysicalResourceId }).promise();
    if (tableStack?.Stacks?.length > 0) {
      const tableName = tableStack.Stacks[0].Outputs.find((out) => out.OutputKey === `GetAtt${resource.LogicalResourceId}TableName`);
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
  const service = new CloudWatchEvents({ region });
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
      Names: parameterNames.map((name) => path.posix.join('/amplify', appId, envName, `AMPLIFY_${funcName}_${name}`)),
      WithDecryption: true,
    })
    .promise();
};

export const deleteSSMParameter = async (
  region: string,
  appId: string,
  envName: string,
  category: string,
  funcName: string,
  parameterName: string,
) => {
  const ssmClient = new SSM({ region });
  return await ssmClient
    .deleteParameter({
      Name: path.posix.join('/amplify', appId, envName, `AMPLIFY_${category}_${funcName}_${parameterName}`),
    })
    .promise();
};

export const getSSMParametersCategoryPrefix = async (
  region: string,
  appId: string,
  envName: string,
  category: string,
  resourceName: string,
  parameterNames: string[],
) => {
  const ssmClient = new SSM({ region });
  if (!parameterNames || parameterNames.length === 0) {
    throw new Error('no parameterNames specified');
  }
  return ssmClient
    .getParameters({
      Names: parameterNames.map((name) => `/amplify/${appId}/${envName}/AMPLIFY_${category}_${resourceName}_${name}`),
    })
    .promise();
};

export const getAllSSMParamatersForAppId = async (appId: string, region: string): Promise<Array<string>> => {
  const ssmClient = new SSM({ region });
  const retrievedParameters: Array<string> = [];
  let receivedNextToken = '';
  do {
    const ssmArgument = getSsmSdkParametersByPath(appId, receivedNextToken);
    const data = await ssmClient.getParametersByPath(ssmArgument).promise();
    retrievedParameters.push(...data.Parameters.map((returnedParameter) => returnedParameter.Name));
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
  expect(result.InvalidParameters.length).toBe(expectNotExist.length);
  expect(result.InvalidParameters.sort()).toEqual(expectNotExist.map(mapName).sort());
  expect(result.Parameters.length).toBe(expectToExist.length);
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
  const service = new Location({ region });
  return await service
    .describeMap({
      MapName: mapName,
    })
    .promise();
};

export const getPlaceIndex = async (placeIndexName: string, region: string) => {
  const service = new Location({ region });
  return await service
    .describePlaceIndex({
      IndexName: placeIndexName,
    })
    .promise();
};

export const getGeofenceCollection = async (geofenceCollectionName: string, region: string) => {
  const service = new Location({ region });
  return await service
    .describeGeofenceCollection({
      CollectionName: geofenceCollectionName,
    })
    .promise();
};

export const getGeofence = async (geofenceCollectionName: string, geofenceId: string, region: string) => {
  const service = new Location({ region });
  return (
    await service.getGeofence({
      CollectionName: geofenceCollectionName,
      GeofenceId: geofenceId,
    })
  ).promise();
};

// eslint-disable-next-line spellcheck/spell-checker
export const listGeofences = async (geofenceCollectionName: string, region: string, nextToken: string = null) => {
  const service = new Location({ region });
  // eslint-disable-next-line spellcheck/spell-checker
  return (
    await service.listGeofences({
      CollectionName: geofenceCollectionName,
      NextToken: nextToken,
    })
  ).promise();
};
