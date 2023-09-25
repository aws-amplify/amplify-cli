/* eslint-disable camelcase */
/* eslint-disable spellcheck/spell-checker */
import { config } from 'dotenv';
import yargs from 'yargs';
import * as aws from 'aws-sdk';
import _ from 'lodash';
import fs from 'fs-extra';
import path from 'path';
import { deleteS3Bucket, sleep } from '@aws-amplify/amplify-e2e-core';

// Ensure that scripts/cci-utils.ts is also updated when this gets updated
const AWS_REGIONS_TO_RUN_TESTS = [
  'us-east-1',
  'us-east-2',
  'us-west-2',
  'eu-west-2',
  'eu-west-3',
  'eu-central-1',
  'ap-northeast-1',
  'ap-northeast-2',
  'ap-southeast-1',
  'ap-southeast-2',
];

const AWS_REGIONS_TO_RUN_TESTS_PINPOINT = AWS_REGIONS_TO_RUN_TESTS.filter((region) => region !== 'eu-west-3');

// Limits are enforced per region
// we collect resources from each region & then delete as an entire batch
const DELETE_LIMITS = {
  PER_REGION: {
    OTHER: 25,
    CFN_STACK: 50,
  },
  PER_BATCH: {
    OTHER: 50,
    CFN_STACK: 100,
  },
};

const reportPath = path.normalize(path.join(__dirname, '..', 'amplify-e2e-reports', 'stale-resources.json'));

const MULTI_JOB_APP = '<Amplify App reused by multiple apps>';
const ORPHAN = '<orphan>';
const UNKNOWN = '<unknown>';

type StackInfo = {
  stackName: string;
  stackStatus: string;
  resourcesFailedToDelete?: string[];
  tags: Record<string, string>;
  region: string;
};

type AmplifyAppInfo = {
  appId: string;
  name: string;
  region: string;
  backends: Record<string, StackInfo>;
};

type S3BucketInfo = {
  name: string;
  createTime: Date;
};

type UserPoolInfo = {
  name: string;
  region: string;
  userPoolId: string;
};

type PinpointAppInfo = {
  id: string;
  name: string;
  arn: string;
  region: string;
  createTime: Date;
};

type IamRoleInfo = {
  name: string;
  createTime: Date;
};

type AppSyncApiInfo = {
  apiId: string;
  name: string;
  region: string;
};

type ReportEntry = {
  jobId?: string;
  workflowId?: string;
  lifecycle?: string;
  amplifyApps: AmplifyAppInfo[];
  stacks: StackInfo[];
  buckets: Record<string, S3BucketInfo>;
  roles: Record<string, IamRoleInfo>;
  pinpointApps: Record<string, PinpointAppInfo>;
  appSyncApis: Record<string, AppSyncApiInfo>;
  userPools: Record<string, UserPoolInfo>;
};

type JobFilterPredicate = (job: ReportEntry) => boolean;

type CCIJobInfo = {
  workflowId: string;
  workflowName: string;
  lifecycle: string;
  cciJobDetails: string;
  status: string;
};

type AWSAccountInfo = {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;
  parent: boolean;
};

const PINPOINT_TEST_REGEX = /integtest/;
const APPSYNC_TEST_REGEX = /integtest/;
const BUCKET_TEST_REGEX = /test/;
const IAM_TEST_REGEX = /!RotateE2eAwsToken-e2eTestContextRole|-integtest$|^amplify-|^eu-|^us-|^ap-/;
const USER_POOL_TEST_REGEX = /integtest|amplify_backend_manager/;
const STALE_DURATION_MS = 2 * 60 * 60 * 1000; // 2 hours in milliseconds

/*
 * Exit on expired token as all future requests will fail.
 */
const handleExpiredTokenException = (): void => {
  console.log('Token expired. Exiting...');
  process.exit();
};

/**
 * Check if a resource is stale based on its created date
 * @param created
 * @returns
 */
const isStale = (created: Date): boolean => {
  const now = new Date().getTime();
  const isStale = now - created.getTime() > STALE_DURATION_MS;
  return isStale;
};

/**
 * We define a resource as viable for deletion if it matches TEST_REGEX in the name, and if it is > STALE_DURATION_MS old.
 */
const testBucketStalenessFilter = (resource: aws.S3.Bucket): boolean => {
  const isTestResource = resource.Name.match(BUCKET_TEST_REGEX);
  return isTestResource && isStale(resource.CreationDate);
};

const testRoleStalenessFilter = (resource: aws.IAM.Role): boolean => {
  const isTestResource = resource.RoleName.match(IAM_TEST_REGEX);
  return isTestResource && isStale(resource.CreateDate);
};

const testUserPoolStalenessFilter = (resource: aws.CognitoIdentityServiceProvider.UserPoolDescriptionType): boolean => {
  const isTestResource = resource.Name.match(USER_POOL_TEST_REGEX);
  return isTestResource && isStale(resource.CreationDate);
};

const testAppSyncApiStalenessFilter = (resource: aws.AppSync.GraphqlApi): boolean => {
  const isTestResource = resource.name.match(APPSYNC_TEST_REGEX);
  const createTimeTagValue = resource.tags['circleci:create_time'];
  let isStaleResource = true;
  if (createTimeTagValue) {
    const createTime = new Date(createTimeTagValue);
    isStaleResource = isStale(createTime);
  }
  return isTestResource && isStaleResource;
};

const testPinpointAppStalenessFilter = (resource: aws.Pinpoint.ApplicationResponse): boolean => {
  const isTestResource = resource.Name.match(PINPOINT_TEST_REGEX);
  return isTestResource && isStale(new Date(resource.CreationDate));
};

/**
 * Get all S3 buckets in the account, and filter down to the ones we consider stale.
 */
const getOrphanS3TestBuckets = async (account: AWSAccountInfo): Promise<S3BucketInfo[]> => {
  const s3Client = new aws.S3(getAWSConfig(account));
  const listBucketResponse = await s3Client.listBuckets().promise();
  const staleBuckets = listBucketResponse.Buckets.filter(testBucketStalenessFilter);
  return staleBuckets.map((it) => ({ name: it.Name, createTime: it.CreationDate }));
};

/**
 * Get all iam roles in the account, and filter down to the ones we consider stale.
 */
const getOrphanTestIamRoles = async (account: AWSAccountInfo): Promise<IamRoleInfo[]> => {
  const iamClient = new aws.IAM(getAWSConfig(account));
  const listRoleResponse = await iamClient.listRoles({ MaxItems: 1000 }).promise();
  const staleRoles = listRoleResponse.Roles.filter(testRoleStalenessFilter);
  return staleRoles.map((it) => ({ name: it.RoleName, createTime: it.CreateDate }));
};

const getOrphanPinpointApplications = async (account: AWSAccountInfo, region: string): Promise<PinpointAppInfo[]> => {
  const pinpoint = new aws.Pinpoint(getAWSConfig(account, region));
  const apps: PinpointAppInfo[] = [];
  let nextToken = null;

  do {
    const result = await pinpoint
      .getApps({
        Token: nextToken,
      })
      .promise();
    apps.push(
      ...result.ApplicationsResponse.Item.filter(testPinpointAppStalenessFilter).map((it) => ({
        id: it.Id,
        name: it.Name,
        arn: it.Arn,
        region,
        createTime: new Date(it.CreationDate),
      })),
    );

    nextToken = result.ApplicationsResponse.NextToken;
  } while (nextToken);

  return apps;
};

const getOrphanUserPools = async (account: AWSAccountInfo, region: string): Promise<UserPoolInfo[]> => {
  const cognitoClient = new aws.CognitoIdentityServiceProvider(getAWSConfig(account, region));
  const userPools = await cognitoClient.listUserPools({ MaxResults: 60 }).promise();
  const staleUserPools = userPools.UserPools.filter(testUserPoolStalenessFilter);
  return staleUserPools.map((it) => ({ name: it.Name, userPoolId: it.Id, region }));
};

/**
 * Get all AppSync Apis in the account, and filter down to the ones we consider stale.
 */
const getOrphanAppSyncApis = async (account: AWSAccountInfo, region: string): Promise<AppSyncApiInfo[]> => {
  const appSyncClient = new aws.AppSync(getAWSConfig(account, region));
  const listApisResponse = await appSyncClient.listGraphqlApis({ maxResults: 25 }).promise();
  const staleApis = listApisResponse.graphqlApis.filter(testAppSyncApiStalenessFilter);
  return staleApis.map((it) => ({ apiId: it.apiId, name: it.name, region }));
};

/**
 * Get the relevant AWS config object for a given account and region.
 */
const getAWSConfig = ({ accessKeyId, secretAccessKey, sessionToken }: AWSAccountInfo, region?: string): unknown => ({
  credentials: {
    accessKeyId,
    secretAccessKey,
    sessionToken,
  },
  ...(region ? { region } : {}),
  maxRetries: 10,
});

/**
 * Returns a list of Amplify Apps in the region. The apps includes information about the CircleCI build that created the app
 * This is determined by looking at tags of the backend environments that are associated with the Apps
 * @param account aws account to query for amplify Apps
 * @param region aws region to query for amplify Apps
 * @returns Promise<AmplifyAppInfo[]> a list of Amplify Apps in the region with build info
 */
const getAmplifyApps = async (account: AWSAccountInfo, region: string): Promise<AmplifyAppInfo[]> => {
  const amplifyClient = new aws.Amplify(getAWSConfig(account, region));
  try {
    const amplifyApps = await amplifyClient.listApps({ maxResults: 25 }).promise(); // keeping it to 25 as max supported is 25
    const result: AmplifyAppInfo[] = [];
    for (const app of amplifyApps.apps) {
      if (!isStale(app.createTime)) {
        continue; // skip
      }
      const backends: Record<string, StackInfo> = {};
      try {
        const backendEnvironments = await amplifyClient.listBackendEnvironments({ appId: app.appId, maxResults: 5 }).promise();
        for (const backendEnv of backendEnvironments.backendEnvironments) {
          const buildInfo = await getStackDetails(backendEnv.stackName, account, region);
          if (buildInfo) {
            backends[backendEnv.environmentName] = buildInfo;
          }
        }
      } catch (e) {
        // console.log(e);
      }
      result.push({
        appId: app.appId,
        name: app.name,
        region,
        backends,
      });
    }
    return result;
  } catch (e) {
    console.log(e);
    return [];
  }
};

/**
 * Return the CircleCI job id looking at `circleci:build_id` in the tags
 * @param tags Tags associated with the resource
 * @returns build number or undefined
 */
const getJobId = (tags: aws.CloudFormation.Tags = []): number | undefined => {
  const jobId = tags.find((tag) => tag.Key === 'circleci:build_id')?.Value;
  return jobId && Number.parseInt(jobId, 10);
};

/**
 * Gets detail about a stack including the details about CircleCI job that created the stack. If a stack
 * has status of `DELETE_FAILED` then it also includes the list of physical id of resources that caused
 * deletion failures
 *
 * @param stackName name of the stack
 * @param account account
 * @param region region
 * @returns stack details
 */
const getStackDetails = async (stackName: string, account: AWSAccountInfo, region: string): Promise<StackInfo | void> => {
  const cfnClient = new aws.CloudFormation(getAWSConfig(account, region));
  const stack = await cfnClient.describeStacks({ StackName: stackName }).promise();
  const tags = stack.Stacks.length && stack.Stacks[0].Tags;
  const stackStatus = stack.Stacks[0].StackStatus;
  let resourcesFailedToDelete: string[] = [];
  if (stackStatus === 'DELETE_FAILED') {
    // Todo: We need to investigate if we should go ahead and remove the resources to prevent account getting cluttered
    const resources = await cfnClient.listStackResources({ StackName: stackName }).promise();
    resourcesFailedToDelete = resources.StackResourceSummaries.filter((r) => r.ResourceStatus === 'DELETE_FAILED').map(
      (r) => r.LogicalResourceId,
    );
  }
  return {
    stackName,
    stackStatus,
    resourcesFailedToDelete,
    region,
    tags: tags.reduce((acc, tag) => ({ ...acc, [tag.Key]: tag.Value }), {}),
  };
};

const getStacks = async (account: AWSAccountInfo, region: string): Promise<StackInfo[]> => {
  const cfnClient = new aws.CloudFormation(getAWSConfig(account, region));
  const stackStatusFilter = [
    'CREATE_COMPLETE',
    'ROLLBACK_FAILED',
    'ROLLBACK_COMPLETE',
    'DELETE_FAILED',
    'UPDATE_COMPLETE',
    'UPDATE_ROLLBACK_FAILED',
    'UPDATE_ROLLBACK_COMPLETE',
    'IMPORT_COMPLETE',
    'IMPORT_ROLLBACK_FAILED',
    'IMPORT_ROLLBACK_COMPLETE',
  ];
  const stacks = await cfnClient
    .listStacks({
      StackStatusFilter: stackStatusFilter,
    })
    .promise();
  // loop
  let nextToken = stacks.NextToken;
  while (nextToken && stacks.StackSummaries.length < DELETE_LIMITS.PER_REGION.CFN_STACK) {
    const nextPage = await cfnClient
      .listStacks({
        StackStatusFilter: stackStatusFilter,
        NextToken: nextToken,
      })
      .promise();
    stacks.StackSummaries.push(...nextPage.StackSummaries);
    nextToken = nextPage.NextToken;
  }

  // We are interested in only the root stacks that are deployed by amplify-cli
  // NOTE: every few months, we should disable the filter , and clean up all stacks (not just root stacks)
  // this is because some child stacks fail to delete (but we don't let that stop us from deleting root stacks)
  // eventually, we must clean up those child stacks too.
  let rootStacks = stacks.StackSummaries.filter((stack) => {
    const isRoot = !stack.RootId;
    const isStackStale = isStale(stack.CreationTime);
    if (!isStackStale) {
      console.log('Skipping stack because created date is:', stack.CreationTime);
    }
    return isRoot && isStackStale;
  });
  if (rootStacks.length > DELETE_LIMITS.PER_REGION.CFN_STACK) {
    // we can only delete 100 stacks accross all regions every batch,
    // so we shouldn't take more than 50 stacks from each of those 8 regions.
    // this should at least limit calls to getStackDetails below
    rootStacks = rootStacks.slice(0, DELETE_LIMITS.PER_REGION.CFN_STACK);
  }
  const results: StackInfo[] = [];
  for (const stack of rootStacks) {
    try {
      const details = await getStackDetails(stack.StackName, account, region);
      if (details) {
        results.push(details);
      }
    } catch {
      // don't want to barf and fail e2e tests
    }
  }
  return results;
};

const getS3Buckets = async (account: AWSAccountInfo): Promise<S3BucketInfo[]> => {
  const s3Client = new aws.S3(getAWSConfig(account));
  const buckets = await s3Client.listBuckets().promise();
  const result: S3BucketInfo[] = [];
  for (const bucket of buckets.Buckets) {
    try {
      const bucketDetails = await s3Client.getBucketTagging({ Bucket: bucket.Name }).promise();
      const jobId = getJobId(bucketDetails.TagSet);
      if (jobId) {
        result.push({
          name: bucket.Name,
          createTime: bucket.CreationDate,
        });
      }
    } catch (e) {
      if (e.code !== 'NoSuchTagSet' && e.code !== 'NoSuchBucket') {
        throw e;
      }
      result.push({
        name: bucket.Name,
        createTime: bucket.CreationDate,
      });
    }
  }
  return result;
};

/**
 * extract and moves CircleCI job details
 */
const extractCCIJobInfo = (record: S3BucketInfo | StackInfo | AmplifyAppInfo): CCIJobInfo => ({
  workflowId: _.get(record, ['0', 'cciInfo', 'workflows', 'workflow_id']),
  workflowName: _.get(record, ['0', 'cciInfo', 'workflows', 'workflow_name']),
  lifecycle: _.get(record, ['0', 'cciInfo', 'lifecycle']),
  cciJobDetails: _.get(record, ['0', 'cciInfo']),
  status: _.get(record, ['0', 'cciInfo', 'status']),
});

/**
 * Merges stale resources and returns a list grouped by the CircleCI jobId. Amplify Apps that don't have
 * any backend environment are grouped as Orphan apps and apps that have Backend created by different CircleCI jobs are
 * grouped as MULTI_JOB_APP. Any resource that do not have a CircleCI job is grouped under UNKNOWN
 */
const mergeResourcesByCCIJob = (
  amplifyApp: AmplifyAppInfo[],
  cfnStacks: StackInfo[],
  s3Buckets: S3BucketInfo[],
  orphanS3Buckets: S3BucketInfo[],
  orphanIamRoles: IamRoleInfo[],
  orphanPinpointApplications: PinpointAppInfo[],
  orphanAppSyncApis: AppSyncApiInfo[],
  orphanUserPools: UserPoolInfo[],
): Record<string, ReportEntry> => {
  const result: Record<string, ReportEntry> = {};

  const stacksByJobId = _.groupBy(cfnStacks, (stack: StackInfo) => _.get(stack, ['cciInfo', 'build_num'], UNKNOWN));

  const bucketByJobId = _.groupBy(s3Buckets, (bucketInfo: S3BucketInfo) => _.get(bucketInfo, ['cciInfo', 'build_num'], UNKNOWN));

  const amplifyAppByJobId = _.groupBy(amplifyApp, (appInfo: AmplifyAppInfo) => {
    if (Object.keys(appInfo.backends).length === 0) {
      return ORPHAN;
    }

    const buildIds = _.groupBy(appInfo.backends, (backendInfo) => _.get(backendInfo, ['cciInfo', 'build_num'], UNKNOWN));
    if (Object.keys(buildIds).length === 1) {
      return Object.keys(buildIds)[0];
    }

    return MULTI_JOB_APP;
  });

  _.mergeWith(
    result,
    _.pickBy(amplifyAppByJobId, (__, key) => key !== MULTI_JOB_APP),
    (val, src, key) => ({
      ...val,
      ...extractCCIJobInfo(src),
      jobId: key,
      amplifyApps: src,
    }),
  );

  _.mergeWith(
    result,
    stacksByJobId,
    (__: unknown, key: string) => key !== ORPHAN,
    (val, src, key) => ({
      ...val,
      ...extractCCIJobInfo(src),
      jobId: key,
      stacks: src,
    }),
  );

  _.mergeWith(result, bucketByJobId, (val, src, key) => ({
    ...val,
    ...extractCCIJobInfo(src),
    jobId: key,
    buckets: src,
  }));

  const orphanBuckets = {
    [ORPHAN]: orphanS3Buckets,
  };

  _.mergeWith(result, orphanBuckets, (val, src, key) => ({
    ...val,
    jobId: key,
    buckets: src,
  }));

  const orphanIamRolesGroup = {
    [ORPHAN]: orphanIamRoles,
  };

  _.mergeWith(result, orphanIamRolesGroup, (val, src, key) => ({
    ...val,
    jobId: key,
    roles: src,
  }));

  const orphanPinpointApps = {
    [ORPHAN]: orphanPinpointApplications,
  };

  _.mergeWith(result, orphanPinpointApps, (val, src, key) => ({
    ...val,
    jobId: key,
    pinpointApps: src,
  }));

  _.mergeWith(
    result,
    {
      [ORPHAN]: orphanAppSyncApis,
    },
    (val, src, key) => ({
      ...val,
      jobId: key,
      appSyncApis: src,
    }),
  );

  _.mergeWith(
    result,
    {
      [ORPHAN]: orphanUserPools,
    },
    (val, src, key) => ({
      ...val,
      jobId: key,
      userPools: src,
    }),
  );

  return result;
};

const deleteAmplifyApps = async (account: AWSAccountInfo, accountIndex: number, apps: AmplifyAppInfo[]): Promise<void> => {
  await Promise.all(apps.slice(0, DELETE_LIMITS.PER_BATCH.OTHER).map((app) => deleteAmplifyApp(account, accountIndex, app)));
};

const deleteAmplifyApp = async (account: AWSAccountInfo, accountIndex: number, app: AmplifyAppInfo): Promise<void> => {
  const { name, appId, region } = app;
  console.log(`[ACCOUNT ${accountIndex}] Deleting App ${name}(${appId})`);
  const amplifyClient = new aws.Amplify(getAWSConfig(account, region));
  try {
    await amplifyClient.deleteApp({ appId }).promise();
  } catch (e) {
    console.log(`[ACCOUNT ${accountIndex}] Deleting Amplify App ${appId} failed with the following error`, e);
    if (e.code === 'ExpiredTokenException') {
      handleExpiredTokenException();
    }
  }
};

const deleteIamRoles = async (account: AWSAccountInfo, accountIndex: number, roles: IamRoleInfo[]): Promise<void> => {
  await Promise.all(roles.slice(0, DELETE_LIMITS.PER_BATCH.OTHER).map((role) => deleteIamRole(account, accountIndex, role)));
};

const deleteIamRole = async (account: AWSAccountInfo, accountIndex: number, role: IamRoleInfo): Promise<void> => {
  const { name: roleName } = role;
  try {
    console.log(`[ACCOUNT ${accountIndex}] Deleting Iam Role ${roleName}`);
    console.log(`Role creation time (PST): ${role.createTime.toLocaleTimeString('en-US', { timeZone: 'America/Los_Angeles' })}`);
    const iamClient = new aws.IAM(getAWSConfig(account));
    await deleteAttachedRolePolicies(account, accountIndex, roleName);
    await deleteRolePolicies(account, accountIndex, roleName);
    await iamClient.deleteRole({ RoleName: roleName }).promise();
  } catch (e) {
    console.log(`[ACCOUNT ${accountIndex}] Deleting iam role ${roleName} failed with error ${e.message}`);
    if (e.code === 'ExpiredTokenException') {
      handleExpiredTokenException();
    }
  }
};

const deleteAttachedRolePolicies = async (account: AWSAccountInfo, accountIndex: number, roleName: string): Promise<void> => {
  const iamClient = new aws.IAM(getAWSConfig(account));
  const rolePolicies = await iamClient.listAttachedRolePolicies({ RoleName: roleName }).promise();
  await Promise.all(rolePolicies.AttachedPolicies.map((policy) => detachIamAttachedRolePolicy(account, accountIndex, roleName, policy)));
};

const detachIamAttachedRolePolicy = async (
  account: AWSAccountInfo,
  accountIndex: number,
  roleName: string,
  policy: aws.IAM.AttachedPolicy,
): Promise<void> => {
  try {
    console.log(`[ACCOUNT ${accountIndex}] Detach Iam Attached Role Policy ${policy.PolicyName}`);
    const iamClient = new aws.IAM(getAWSConfig(account));
    await iamClient.detachRolePolicy({ RoleName: roleName, PolicyArn: policy.PolicyArn }).promise();
  } catch (e) {
    console.log(`[ACCOUNT ${accountIndex}] Detach iam role policy ${policy.PolicyName} failed with error ${e.message}`);
    if (e.code === 'ExpiredTokenException') {
      handleExpiredTokenException();
    }
  }
};

const deleteRolePolicies = async (account: AWSAccountInfo, accountIndex: number, roleName: string): Promise<void> => {
  const iamClient = new aws.IAM(getAWSConfig(account));
  const rolePolicies = await iamClient.listRolePolicies({ RoleName: roleName }).promise();
  await Promise.all(rolePolicies.PolicyNames.map((policy) => deleteIamRolePolicy(account, accountIndex, roleName, policy)));
};

const deleteIamRolePolicy = async (account: AWSAccountInfo, accountIndex: number, roleName: string, policyName: string): Promise<void> => {
  try {
    console.log(`[ACCOUNT ${accountIndex}] Deleting Iam Role Policy ${policyName}`);
    const iamClient = new aws.IAM(getAWSConfig(account));
    await iamClient.deleteRolePolicy({ RoleName: roleName, PolicyName: policyName }).promise();
  } catch (e) {
    console.log(`[ACCOUNT ${accountIndex}] Deleting iam role policy ${policyName} failed with error ${e.message}`);
    if (e.code === 'ExpiredTokenException') {
      handleExpiredTokenException();
    }
  }
};

const deleteBuckets = async (account: AWSAccountInfo, accountIndex: number, buckets: S3BucketInfo[]): Promise<void> => {
  await Promise.all(buckets.slice(0, DELETE_LIMITS.PER_BATCH.OTHER).map((bucket) => deleteBucket(account, accountIndex, bucket)));
};

const deleteBucket = async (account: AWSAccountInfo, accountIndex: number, bucket: S3BucketInfo): Promise<void> => {
  const { name } = bucket;
  try {
    console.log(`[ACCOUNT ${accountIndex}] Deleting S3 Bucket ${name}`);
    console.log(`Bucket creation time (PST): ${bucket.createTime.toLocaleTimeString('en-US', { timeZone: 'America/Los_Angeles' })}`);
    const s3 = new aws.S3(getAWSConfig(account));
    await deleteS3Bucket(name, s3);
  } catch (e) {
    console.log(`[ACCOUNT ${accountIndex}] Deleting bucket ${name} failed with error ${e.message}`);
    if (e.code === 'ExpiredTokenException') {
      handleExpiredTokenException();
    }
  }
};

const deletePinpointApps = async (account: AWSAccountInfo, accountIndex: number, apps: PinpointAppInfo[]): Promise<void> => {
  await Promise.all(apps.slice(0, DELETE_LIMITS.PER_BATCH.OTHER).map((app) => deletePinpointApp(account, accountIndex, app)));
};

const deletePinpointApp = async (account: AWSAccountInfo, accountIndex: number, app: PinpointAppInfo): Promise<void> => {
  const { id, name, region } = app;
  try {
    console.log(`[ACCOUNT ${accountIndex}] Deleting Pinpoint App ${name}`);
    console.log(`Pinpoint creation time (PST): ${app.createTime.toLocaleTimeString('en-US', { timeZone: 'America/Los_Angeles' })}`);
    const pinpoint = new aws.Pinpoint(getAWSConfig(account, region));
    await pinpoint.deleteApp({ ApplicationId: id }).promise();
  } catch (e) {
    console.log(`[ACCOUNT ${accountIndex}] Deleting pinpoint app ${name} failed with error ${e.message}`);
  }
};

const deleteAppSyncApis = async (account: AWSAccountInfo, accountIndex: number, apis: AppSyncApiInfo[]): Promise<void> => {
  await Promise.all(apis.slice(0, DELETE_LIMITS.PER_BATCH.OTHER).map((api) => deleteAppSyncApi(account, accountIndex, api)));
};

const deleteAppSyncApi = async (account: AWSAccountInfo, accountIndex: number, api: AppSyncApiInfo): Promise<void> => {
  const { apiId, name, region } = api;
  try {
    console.log(`[ACCOUNT ${accountIndex}] Deleting AppSync Api ${name}`);
    const appSync = new aws.AppSync(getAWSConfig(account, region));
    await appSync.deleteGraphqlApi({ apiId }).promise();
  } catch (e) {
    console.log(`[ACCOUNT ${accountIndex}] Deleting AppSync Api ${name} failed with error ${e.message}`);
  }
};

const deleteUserPools = async (account: AWSAccountInfo, accountIndex: number, userPools: UserPoolInfo[]): Promise<void> => {
  await Promise.all(userPools.slice(0, DELETE_LIMITS.PER_BATCH.OTHER).map((userPool) => deleteUserPool(account, accountIndex, userPool)));
};

const deleteUserPool = async (account: AWSAccountInfo, accountIndex: number, userPool: UserPoolInfo): Promise<void> => {
  const { name, region, userPoolId } = userPool;
  try {
    console.log(`[ACCOUNT ${accountIndex}] Deleting UserPool ${name}`);
    const cognitoClient = new aws.CognitoIdentityServiceProvider(getAWSConfig(account, region));
    const userPoolDetails = await cognitoClient.describeUserPool({ UserPoolId: userPoolId }).promise();
    if (userPoolDetails.UserPool.Domain) {
      await cognitoClient
        .deleteUserPoolDomain({
          UserPoolId: userPoolId,
          Domain: userPoolDetails.UserPool.Domain,
        })
        .promise();
    }
    await cognitoClient.deleteUserPool({ UserPoolId: userPoolId }).promise();
  } catch (e) {
    console.log(`[ACCOUNT ${accountIndex}] Deleting UserPool ${name} failed with error ${e.message}`);
  }
};

const deleteCfnStacks = async (account: AWSAccountInfo, accountIndex: number, stacks: StackInfo[]): Promise<void> => {
  await Promise.all(stacks.slice(0, DELETE_LIMITS.PER_BATCH.CFN_STACK).map((stack) => deleteCfnStack(account, accountIndex, stack)));
};

const deleteCfnStack = async (account: AWSAccountInfo, accountIndex: number, stack: StackInfo): Promise<void> => {
  const { stackName, region, resourcesFailedToDelete } = stack;
  const resourceToRetain = resourcesFailedToDelete.length ? resourcesFailedToDelete : undefined;
  console.log(`[ACCOUNT ${accountIndex}] Deleting CloudFormation stack ${stackName}`);
  try {
    const cfnClient = new aws.CloudFormation(getAWSConfig(account, region));
    await cfnClient.deleteStack({ StackName: stackName, RetainResources: resourceToRetain }).promise();
    // we'll only wait up to a minute before moving on
    await cfnClient.waitFor('stackDeleteComplete', { StackName: stackName, $waiter: { maxAttempts: 2 } }).promise();
  } catch (e) {
    console.log(`Deleting CloudFormation stack ${stackName} failed with error ${e.message}`);
    if (e.code === 'ExpiredTokenException') {
      handleExpiredTokenException();
    }
  }
};

const generateReport = (jobs: _.Dictionary<ReportEntry>): void => {
  fs.ensureFileSync(reportPath);
  fs.writeFileSync(reportPath, JSON.stringify(jobs, null, 4));
};

/**
 * While we basically fan-out deletes elsewhere in this script, leaving the app->cfn->bucket delete process
 * serial within a given account, it's not immediately clear if this is necessary, but seems possibly valuable.
 */
const deleteResources = async (
  account: AWSAccountInfo,
  accountIndex: number,
  staleResources: Record<string, ReportEntry>,
): Promise<void> => {
  for (const jobId of Object.keys(staleResources)) {
    const resources = staleResources[jobId];
    if (resources.amplifyApps) {
      console.log(`Deleting up to ${DELETE_LIMITS.PER_BATCH.OTHER} of ${resources.amplifyApps.length} apps on ACCOUNT[${accountIndex}]`);
      await deleteAmplifyApps(account, accountIndex, Object.values(resources.amplifyApps));
    }

    if (resources.stacks) {
      console.log(`Deleting up to ${DELETE_LIMITS.PER_BATCH.CFN_STACK} of ${resources.stacks.length} stacks on ACCOUNT[${accountIndex}]`);
      await deleteCfnStacks(account, accountIndex, Object.values(resources.stacks));
    }

    if (resources.buckets) {
      console.log(`Deleting up to ${DELETE_LIMITS.PER_BATCH.OTHER} of ${resources.buckets.length} buckets on ACCOUNT[${accountIndex}]`);
      await deleteBuckets(account, accountIndex, Object.values(resources.buckets));
    }

    if (resources.roles) {
      console.log(`Deleting up to ${DELETE_LIMITS.PER_BATCH.OTHER} of ${resources.roles.length} roles on ACCOUNT[${accountIndex}]`);
      await deleteIamRoles(account, accountIndex, Object.values(resources.roles));
    }

    if (resources.pinpointApps) {
      console.log(
        `Deleting up to ${DELETE_LIMITS.PER_BATCH.OTHER} of ${resources.pinpointApps.length} pinpoint apps on ACCOUNT[${accountIndex}]`,
      );
      await deletePinpointApps(account, accountIndex, Object.values(resources.pinpointApps));
    }

    if (resources.appSyncApis) {
      console.log(
        `Deleting up to ${DELETE_LIMITS.PER_BATCH.OTHER} of ${resources.appSyncApis.length} appSyncApis on ACCOUNT[${accountIndex}]`,
      );
      await deleteAppSyncApis(account, accountIndex, Object.values(resources.appSyncApis));
    }

    if (resources.userPools) {
      console.log(`Deleting up to ${DELETE_LIMITS.PER_BATCH.OTHER} of ${resources.userPools.length} userPools on ACCOUNT[${accountIndex}]`);
      await deleteUserPools(account, accountIndex, Object.values(resources.userPools));
    }
  }
};

/**
 * Grab the right CircleCI filter based on args passed in.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getFilterPredicate = (args: any): JobFilterPredicate => {
  const filterByJobId = (jobId: string) => (job: ReportEntry) => job.jobId === jobId;
  const filterByWorkflowId = (workflowId: string) => (job: ReportEntry) => job.workflowId === workflowId;
  const filterAllStaleResources = () => (job: ReportEntry) => job.lifecycle === 'finished' || job.jobId === ORPHAN;

  if (args._.length === 0) {
    return filterAllStaleResources();
  }
  if (args._[0] === 'workflow') {
    return filterByWorkflowId(args.workflowId as string);
  }
  if (args._[0] === 'job') {
    if (Number.isNaN(args.jobId)) {
      throw new Error('job-id should be integer');
    }
    return filterByJobId((args.jobId as number).toString());
  }
  throw Error('Invalid args config');
};

/**
 * Retrieve the accounts to process for potential cleanup. By default we will attempt
 * to get all accounts within the root account organization.
 */
const getAccountsToCleanup = async (): Promise<AWSAccountInfo[]> => {
  const stsRes = new aws.STS({
    apiVersion: '2011-06-15',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
  });
  const parentAccountIdentity = await stsRes.getCallerIdentity().promise();
  const orgApi = new aws.Organizations({
    apiVersion: '2016-11-28',
    // the region where the organization exists
    region: 'us-east-1',
  });
  try {
    const orgAccounts = await orgApi.listAccounts().promise();
    const allAccounts = orgAccounts.Accounts;
    let nextToken = orgAccounts.NextToken;
    while (nextToken) {
      const nextPage = await orgApi.listAccounts({ NextToken: nextToken }).promise();
      allAccounts.push(...nextPage.Accounts);
      nextToken = nextPage.NextToken;
    }
    const accountCredentialPromises = allAccounts.map(async (account) => {
      if (account.Id === parentAccountIdentity.Account) {
        return {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          sessionToken: process.env.AWS_SESSION_TOKEN,
          parent: true,
        };
      }
      const randomNumber = Math.floor(Math.random() * 100000);
      const assumeRoleRes = await stsRes
        .assumeRole({
          RoleArn: `arn:aws:iam::${account.Id}:role/OrganizationAccountAccessRole`,
          RoleSessionName: `testSession${randomNumber}`,
          // One hour
          DurationSeconds: 1 * 60 * 60,
        })
        .promise();
      return {
        accessKeyId: assumeRoleRes.Credentials.AccessKeyId,
        secretAccessKey: assumeRoleRes.Credentials.SecretAccessKey,
        sessionToken: assumeRoleRes.Credentials.SessionToken,
        parent: false,
      };
    });
    return await Promise.all(accountCredentialPromises);
  } catch (e) {
    console.error(e);
    console.log(
      'Error assuming child account role. This could be because the script is already running from within a child account. Running on current AWS account only.',
    );
    return [
      {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        sessionToken: process.env.AWS_SESSION_TOKEN,
        parent: true,
      },
    ];
  }
};

const cleanupAccount = async (account: AWSAccountInfo, accountIndex: number, filterPredicate: JobFilterPredicate): Promise<void> => {
  const appPromises = AWS_REGIONS_TO_RUN_TESTS.map((region) => getAmplifyApps(account, region));
  const stackPromises = AWS_REGIONS_TO_RUN_TESTS.map((region) => getStacks(account, region));
  const bucketPromise = getS3Buckets(account);
  const orphanPinpointApplicationsPromise = AWS_REGIONS_TO_RUN_TESTS_PINPOINT.map((region) =>
    getOrphanPinpointApplications(account, region),
  );
  const orphanBucketPromise = getOrphanS3TestBuckets(account);
  const orphanIamRolesPromise = getOrphanTestIamRoles(account);
  const orphanAppSyncApisPromise = AWS_REGIONS_TO_RUN_TESTS.map((region) => getOrphanAppSyncApis(account, region));
  const orphanUserPoolsPromise = AWS_REGIONS_TO_RUN_TESTS.map((region) => getOrphanUserPools(account, region));

  const apps = (await Promise.all(appPromises)).flat();
  const stacks = (await Promise.all(stackPromises)).flat();
  const buckets = await bucketPromise;
  const orphanBuckets = await orphanBucketPromise;
  const orphanIamRoles = await orphanIamRolesPromise;
  const orphanPinpointApplications = (await Promise.all(orphanPinpointApplicationsPromise)).flat();
  const orphanAppSyncApis = (await Promise.all(orphanAppSyncApisPromise)).flat();
  const orphanUserPools = (await Promise.all(orphanUserPoolsPromise)).flat();

  const allResources = mergeResourcesByCCIJob(
    apps,
    stacks,
    buckets,
    orphanBuckets,
    orphanIamRoles,
    orphanPinpointApplications,
    orphanAppSyncApis,
    orphanUserPools,
  );
  // cleanup resources that are <unknown> but that are definitely amplify resources
  // this includes apps with names that include "test" or stacks that include both "amplify" & "test"
  const testApps = allResources['<unknown>']?.amplifyApps?.filter((a) => a.name.toLocaleLowerCase().includes('test'));
  const testStacks = allResources['<unknown>']?.stacks?.filter(
    (s) => s.stackName.toLocaleLowerCase().includes('test') && s.stackName.toLocaleLowerCase().includes('amplify'),
  );
  const orphanedResources = allResources['<orphan>'];
  orphanedResources.amplifyApps = orphanedResources.amplifyApps ?? [];
  orphanedResources.stacks = orphanedResources.stacks ?? [];
  orphanedResources.amplifyApps.push(...(testApps ? testApps : []));
  orphanedResources.stacks.push(...(testStacks ? testStacks : []));
  const staleResources = _.pickBy(allResources, filterPredicate);

  generateReport(staleResources);
  await deleteResources(account, accountIndex, staleResources);
  console.log(`[ACCOUNT ${accountIndex}] Cleanup done!`);
};

/**
 * Execute the cleanup script.
 * Cleanup will happen in parallel across all accounts within a given organization,
 * based on the requested filter parameters (i.e. for a given workflow, job, or all stale resources).
 * Logs are emitted for given account ids anywhere we've fanned out, but we use an indexing scheme instead
 * of account ids since the logs these are written to will be effectively public.
 */
const cleanup = async (): Promise<void> => {
  const args = yargs
    .command('*', 'clean up all the stale resources')
    .command('workflow <workflow-id>', 'clean all the resources created by workflow', (_yargs) => {
      _yargs.positional('workflowId', {
        describe: 'Workflow Id of the workflow',
        type: 'string',
        demandOption: '',
      });
    })
    .command('job <jobId>', 'clean all the resource created by a job', (_yargs) => {
      _yargs.positional('jobId', {
        describe: 'job id of the job',
        type: 'number',
      });
    })
    .help().argv;
  config();

  const filterPredicate = getFilterPredicate(args);
  const accounts = await getAccountsToCleanup();
  for (let i = 0; i < 3; i++) {
    console.log('CLEANUP ROUND: ', i + 1);
    await Promise.all(
      accounts.map((account, i) => {
        return cleanupAccount(account, i, filterPredicate);
      }),
    );
    await sleep(60 * 1000); // run again after 60 seconds
  }
  console.log('Done cleaning all accounts!');
};

void cleanup();
