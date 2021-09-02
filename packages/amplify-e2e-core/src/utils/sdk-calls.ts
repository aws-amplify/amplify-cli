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
} from 'aws-sdk';
import * as path from 'path';
import _ from 'lodash';
import { pathManager } from 'amplify-cli-core';
import * as ini from 'ini';
import * as fs from 'fs-extra';

export const getCredentials = () => {
  if (process.env.CREDENTIALS_OVERWRITTEN || process.env.USE_PARENT_ACCOUNT) {
    return {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      sessionToken: process.env.AWS_SESSION_TOKEN,
      region: process.env.CLI_REGION,
    };
  }

  // We should use configured credentials above environment variables when they exist
  let creds: any = {};
  if (fs.existsSync(pathManager.getAWSCredentialsFilePath())) {
    const credentialsContents = ini.parse(fs.readFileSync(pathManager.getAWSCredentialsFilePath()).toString());
    if (credentialsContents['amplify-integ-test-user']) {
      creds = credentialsContents['amplify-integ-test-user'];
    } else if (credentialsContents['default']) {
      creds = credentialsContents['default'];
    }
  }
  let config: any = {};
  if (fs.existsSync(pathManager.getAWSConfigFilePath())) {
    const configContents = ini.parse(fs.readFileSync(pathManager.getAWSConfigFilePath()).toString());
    if (configContents['profile amplify-integ-test-user']) {
      config = configContents['profile amplify-integ-test-user'];
    } else if (configContents['default']) {
      config = configContents['default'];
    }
  }

  const credentials = {
    accessKeyId: creds.aws_access_key_id || process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: creds.aws_secret_access_key || process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: creds.aws_session_token || process.env.AWS_SESSION_TOKEN,
    region: config.region || process.env.CLI_REGION || 'us-west-2',
  };
  process.env.AWS_ACCESS_KEY_ID = credentials.accessKeyId;
  process.env.AWS_SECRET_ACCESS_KEY = credentials.secretAccessKey;
  process.env.AWS_SESSION_TOKEN = credentials.sessionToken;
  process.env.AWS_DEFAULT_REGION = credentials.region;
  process.env.AWS_REGION = credentials.region;
  process.env.CREDENTIALS_OVERWRITTEN = '1';
  return credentials;
};

export const getDDBTable = async (tableName: string, region: string) => {
  const service = new DynamoDB({ region, ...getCredentials() });
  if (tableName) {
    return await service.describeTable({ TableName: tableName }).promise();
  }
};

export const checkIfBucketExists = async (bucketName: string, region: string) => {
  const service = new S3({ ...getCredentials(), region });
  return await service.headBucket({ Bucket: bucketName }).promise();
};

export const bucketNotExists = async (bucket: string) => {
  const s3 = new S3(getCredentials());
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
  const s3 = new S3(getCredentials());
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

export const deleteS3Bucket = async (bucket: string) => {
  const s3 = new S3(getCredentials());
  let continuationToken: Required<Pick<S3.ListObjectVersionsOutput, 'KeyMarker' | 'VersionIdMarker'>> = undefined;
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
    .map(r => {
      return {
        Bucket: bucket,
        Delete: {
          Objects: r,
          Quiet: true,
        },
      };
    })
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
    res = await new CognitoIdentityServiceProvider(getCredentials()).describeUserPool({ UserPoolId: userpoolId }).promise();
  } catch (e) {
    console.log(e);
  }
  return res;
};

export const getLambdaFunction = async (functionName: string, region: string) => {
  const lambda = new Lambda({ region, ...getCredentials() });
  try {
    return await lambda.getFunction({ FunctionName: functionName }).promise();
  } catch (e) {
    console.log(e);
  }
};

export const getUserPoolClients = async (userPoolId: string, clientIds: string[], region: string) => {
  const provider = new CognitoIdentityServiceProvider({ region, ...getCredentials() });
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

export const getBot = async (botName: string, region: string) => {
  const service = new LexModelBuildingService({ region, ...getCredentials() });
  return await service.getBot({ name: botName, versionOrAlias: '$LATEST' }).promise();
};

export const getFunction = async (functionName: string, region: string) => {
  const service = new Lambda({ region, ...getCredentials() });
  return await service.getFunction({ FunctionName: functionName }).promise();
};

export const getLayerVersion = async (functionArn: string, region: string) => {
  const service = new Lambda({ region, ...getCredentials() });
  return await service.getLayerVersionByArn({ Arn: functionArn }).promise();
};

export const listVersions = async (layerName: string, region: string) => {
  const service = new Lambda({ region, ...getCredentials() });
  return await service.listLayerVersions({ LayerName: layerName }).promise();
};

export const invokeFunction = async (functionName: string, payload: string, region: string) => {
  const service = new Lambda({ region, ...getCredentials() });
  return await service.invoke({ FunctionName: functionName, Payload: payload }).promise();
};

export const getCollection = async (collectionId: string, region: string) => {
  const service = new Rekognition({ region, ...getCredentials() });
  return await service.describeCollection({ CollectionId: collectionId }).promise();
};

export const getTable = async (tableName: string, region: string) => {
  const service = new DynamoDB({ region, ...getCredentials() });
  return await service.describeTable({ TableName: tableName }).promise();
};

export const getEventSourceMappings = async (functionName: string, region: string) => {
  const service = new Lambda({ region, ...getCredentials() });
  return (await service.listEventSourceMappings({ FunctionName: functionName }).promise()).EventSourceMappings;
};

export const deleteTable = async (tableName: string, region: string) => {
  const service = new DynamoDB({ region, ...getCredentials() });
  return await service.deleteTable({ TableName: tableName }).promise();
};

export const getAppSyncApi = async (appSyncApiId: string, region: string) => {
  const service = new AppSync({ region, ...getCredentials() });
  return await service.getGraphqlApi({ apiId: appSyncApiId }).promise();
};

export const getCloudWatchLogs = async (region: string, logGroupName: string, logStreamName: string | undefined = undefined) => {
  const cloudwatchlogs = new CloudWatchLogs({ region, retryDelayOptions: { base: 500 }, ...getCredentials() });

  let targetStreamName = logStreamName;
  if (targetStreamName === undefined) {
    const describeStreamsResp = await cloudwatchlogs
      .describeLogStreams({ logGroupName, descending: true, orderBy: 'LastEventTime' })
      .promise();
    if (describeStreamsResp.logStreams === undefined || describeStreamsResp.logStreams.length == 0) {
      return [];
    }

    targetStreamName = describeStreamsResp.logStreams[0].logStreamName;
  }

  const logsResp = await cloudwatchlogs.getLogEvents({ logGroupName, logStreamName: targetStreamName }).promise();
  return logsResp.events || [];
};

export const describeCloudFormationStack = async (stackName: string, region: string, profileConfig?: any) => {
  const service = profileConfig ? new CloudFormation({...getCredentials(), ...profileConfig}) : new CloudFormation({ region, ...getCredentials() });
  return (await service.describeStacks({ StackName: stackName }).promise()).Stacks.find(
    stack => stack.StackName === stackName || stack.StackId === stackName,
  );
};

export const getNestedStackID = async (stackName: string, region: string, logicalId: string): Promise<string> => {
  const cfnClient = new CloudFormation({ region, ...getCredentials() });
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
  const cfnClient = new CloudFormation({ region, ...getCredentials() });
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
  const kinesis = new Kinesis({ region, ...getCredentials() });

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
  const service = new CloudWatchEvents(getCredentials());
  var params = {
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
  const amplifyBackend = new AmplifyBackend({ region, ...getCredentials() });

  return await amplifyBackend.createBackendConfig({ AppId: appId }).promise();
};

export const getAmplifyBackendJobStatus = async (jobId: string, appId: string, envName: string, region: string) => {
  const amplifyBackend = new AmplifyBackend({ region, ...getCredentials() });

  return await amplifyBackend
    .getBackendJob({
      JobId: jobId,
      AppId: appId,
      BackendEnvironmentName: envName,
    })
    .promise();
};

export const listRolePolicies = async (roleName: string, region: string) => {
  const service = new IAM({ region, ...getCredentials() });
  return (await service.listRolePolicies({ RoleName: roleName }).promise()).PolicyNames;
};

export const listAttachedRolePolicies = async (roleName: string, region: string) => {
  const service = new IAM({ region, ...getCredentials() });
  return (await service.listAttachedRolePolicies({ RoleName: roleName }).promise()).AttachedPolicies;
};

export const getPermissionsBoundary = async (roleName: string, region) => {
  const iamClient = new IAM({ region, ...getCredentials() });
  return (await iamClient.getRole({ RoleName: roleName }).promise())?.Role?.PermissionsBoundary?.PermissionsBoundaryArn;
};

export const getSSMParameters = async (region: string, appId: string, envName: string, funcName: string, parameterNames: string[]) => {
  const ssmClient = new SSM({ region, ...getCredentials() });
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
