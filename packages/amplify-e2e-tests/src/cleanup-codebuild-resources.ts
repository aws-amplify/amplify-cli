import { AmplifyClient, ListAppsCommand, DeleteAppCommand, ListBackendEnvironmentsCommand } from '@aws-sdk/client-amplify';
import { AppSyncClient, ListGraphqlApisCommand, DeleteGraphqlApiCommand } from '@aws-sdk/client-appsync';
import {
  CloudFormationClient,
  ListStacksCommand,
  DeleteStackCommand,
  DescribeStacksCommand,
  ListStackResourcesCommand,
  StackStatus,
  Tag,
} from '@aws-sdk/client-cloudformation';
import { CodeBuildClient, BatchGetBuildsCommand, Build, StatusType } from '@aws-sdk/client-codebuild';
import {
  CognitoIdentityProviderClient,
  ListUserPoolsCommand,
  DeleteUserPoolCommand,
  DescribeUserPoolCommand,
  DeleteUserPoolDomainCommand,
  UserPoolDescriptionType,
} from '@aws-sdk/client-cognito-identity-provider';
import {
  IAMClient,
  ListRolesCommand,
  DeleteRoleCommand,
  ListRolePoliciesCommand,
  DeleteRolePolicyCommand,
  ListAttachedRolePoliciesCommand,
  DetachRolePolicyCommand,
  ListOpenIDConnectProvidersCommand,
  DeleteOpenIDConnectProviderCommand,
  Role,
  AttachedPolicy,
} from '@aws-sdk/client-iam';
import { OrganizationsClient, ListAccountsCommand } from '@aws-sdk/client-organizations';
import {
  PinpointClient,
  GetAppsCommand,
  DeleteAppCommand as DeletePinpointAppCommand,
  ApplicationResponse,
} from '@aws-sdk/client-pinpoint';
import {
  S3Client,
  ListBucketsCommand,
  DeleteBucketCommand,
  ListObjectsV2Command,
  DeleteObjectsCommand,
  GetBucketTaggingCommand,
  ListObjectVersionsCommand,
  Bucket,
  GetBucketLocationCommand,
} from '@aws-sdk/client-s3';
import { STSClient, GetCallerIdentityCommand, AssumeRoleCommand } from '@aws-sdk/client-sts';
import fs from 'fs-extra';
import _ from 'lodash';
import path from 'path';

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
  cbInfo?: Build;
};

type AmplifyAppInfo = {
  appId: string;
  name: string;
  region: string;
  backends: Record<string, StackInfo>;
};

type S3BucketInfo = {
  name?: string;
  cbInfo?: Build;
  createTime?: Date;
};

type UserPoolInfo = {
  name?: string;
  region: string;
  userPoolId?: string;
};

type PinpointAppInfo = {
  id: string;
  name?: string;
  arn: string;
  region: string;
  cbInfo?: Build;
  createTime: Date;
};

type IamRoleInfo = {
  name: string;
  cbInfo?: Build;
  createTime: Date;
};

type AppSyncApiInfo = {
  apiId?: string;
  name?: string;
  region: string;
  cbInfo?: Build;
};

type ReportEntry = {
  jobId?: string;
  workflowId?: string;
  cbInfo?: Build;
  amplifyApps: AmplifyAppInfo[];
  stacks: StackInfo[];
  buckets: Record<string, S3BucketInfo>;
  roles: Record<string, IamRoleInfo>;
  pinpointApps: Record<string, PinpointAppInfo>;
  appSyncApis: Record<string, AppSyncApiInfo>;
  userPools: Record<string, UserPoolInfo>;
};

type JobFilterPredicate = (job: ReportEntry) => boolean;

type CIJobInfo = {
  workflowId: string;
  workflowName: string;
  ciJobDetails: string;
  buildStatus: string;
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
  process.exit(1);
};

/**
 * Check if a resource is stale based on its created date
 * @param created
 * @returns
 */
const isStale = (created: string | Date | undefined): boolean => {
  let normalizedDate;
  if (typeof created === 'string') {
    normalizedDate = new Date(created);
  } else {
    normalizedDate = created;
  }
  const now = new Date().getTime();
  const isStale = normalizedDate ? now - normalizedDate.getTime() > STALE_DURATION_MS : false;
  return isStale;
};

/**
 * We define a resource as viable for deletion if it matches TEST_REGEX in the name, and if it is > STALE_DURATION_MS old.
 */
const testBucketStalenessFilter = (resource: Bucket): boolean => {
  const isTestResource = !!resource?.Name?.match(BUCKET_TEST_REGEX);
  return isTestResource && isStale(resource.CreationDate);
};

const testRoleStalenessFilter = (resource: Role): boolean => {
  const isTestResource = !!resource?.RoleName?.match(IAM_TEST_REGEX);
  return isTestResource && isStale(resource.CreateDate);
};

const testUserPoolStalenessFilter = (resource: UserPoolDescriptionType): boolean => {
  const isTestResource = !!resource?.Name?.match(USER_POOL_TEST_REGEX);
  return isTestResource && isStale(resource.CreationDate);
};

const testAppSyncApiStalenessFilter = (resource: any): boolean => {
  const isTestResource = !!resource?.name?.match(APPSYNC_TEST_REGEX);
  const createTimeTagValue = resource?.tags?.['codebuild:create_time'];
  let isStaleResource = true;
  if (createTimeTagValue) {
    const createTime = new Date(createTimeTagValue);
    isStaleResource = isStale(createTime);
  }
  return isTestResource && isStaleResource;
};

const testPinpointAppStalenessFilter = (resource: ApplicationResponse): boolean => {
  const isTestResource = !!(resource.Name?.match(PINPOINT_TEST_REGEX) && resource.CreationDate);
  return isTestResource && isStale(resource.CreationDate);
};

/**
 * Get all S3 buckets in the account, and filter down to the ones we consider stale.
 */
const getOrphanS3TestBuckets = async (account: AWSAccountInfo): Promise<S3BucketInfo[]> => {
  const s3Client = new S3Client(getAWSConfig(account));
  const listBucketResponse = await s3Client.send(new ListBucketsCommand({}));
  const staleBuckets = listBucketResponse?.Buckets?.filter(testBucketStalenessFilter);
  return staleBuckets?.map((it) => ({ name: it.Name, createTime: it.CreationDate })) ?? [];
};

/**
 * Get all iam roles in the account, and filter down to the ones we consider stale.
 */
const getOrphanTestIamRoles = async (account: AWSAccountInfo): Promise<IamRoleInfo[]> => {
  const iamClient = new IAMClient(getAWSConfig(account));
  const listRoleResponse = await iamClient.send(new ListRolesCommand({ MaxItems: 1000 }));
  const staleRoles = listRoleResponse.Roles?.filter(testRoleStalenessFilter) ?? [];
  return staleRoles.map((it) => ({ name: it.RoleName!, createTime: it.CreateDate! }));
};

const getOrphanPinpointApplications = async (account: AWSAccountInfo, region: string): Promise<PinpointAppInfo[]> => {
  const pinpoint = new PinpointClient(getAWSConfig(account, region));
  const apps: PinpointAppInfo[] = [];
  let nextToken = undefined;

  do {
    const result = await pinpoint.send(new GetAppsCommand({ Token: nextToken }));
    apps.push(
      ...(result.ApplicationsResponse?.Item || []).filter(testPinpointAppStalenessFilter).map((it) => ({
        id: it.Id!,
        name: it.Name,
        arn: it.Arn!,
        region,
        createTime: new Date(it?.CreationDate ?? 'Invalid Date'),
      })),
    );

    nextToken = result.ApplicationsResponse?.NextToken;
  } while (nextToken);

  return apps;
};

const getOrphanUserPools = async (account: AWSAccountInfo, region: string): Promise<UserPoolInfo[]> => {
  const cognitoClient = new CognitoIdentityProviderClient(getAWSConfig(account, region));
  const userPools = await cognitoClient.send(new ListUserPoolsCommand({ MaxResults: 60 }));
  const staleUserPools = userPools?.UserPools?.filter(testUserPoolStalenessFilter);
  return staleUserPools?.map((it) => ({ name: it.Name, userPoolId: it.Id, region })) ?? [];
};

/**
 * Get all AppSync Apis in the account, and filter down to the ones we consider stale.
 */
const getOrphanAppSyncApis = async (account: AWSAccountInfo, region: string): Promise<AppSyncApiInfo[]> => {
  const appSyncClient = new AppSyncClient(getAWSConfig(account, region));
  const listApisResponse = await appSyncClient.send(new ListGraphqlApisCommand({ maxResults: 25 }));
  const staleApis = listApisResponse?.graphqlApis?.filter(testAppSyncApiStalenessFilter);
  return staleApis?.map((it) => ({ apiId: it.apiId, name: it.name, region })) ?? [];
};

/**
 * Get all OIDC providers in the account that match
 */
const deleteOrphanedOidcProviders = async (account: AWSAccountInfo): Promise<void> => {
  const iamClient = new IAMClient(getAWSConfig(account));
  const response = await iamClient.send(new ListOpenIDConnectProvidersCommand({}));
  if (response.OpenIDConnectProviderList) {
    for (const provider of response.OpenIDConnectProviderList) {
      // these seem to be the only offending resources at this time, but we can add more later
      if (provider.Arn?.endsWith('oidc-provider/accounts.google.com')) {
        console.log('OIDC PROVIDER:', provider.Arn);
        await iamClient.send(new DeleteOpenIDConnectProviderCommand({ OpenIDConnectProviderArn: provider.Arn }));
      }
    }
  }
};

/**
 * Get the relevant AWS config object for a given account and region.
 */
const getAWSConfig = ({ accessKeyId, secretAccessKey, sessionToken }: AWSAccountInfo, region?: string) => ({
  credentials: {
    accessKeyId,
    secretAccessKey,
    sessionToken,
  },
  ...(region ? { region } : {}),
  maxRetries: 10,
  requestHandler: {
    connectionTimeout: 30000,
    socketTimeout: 30000,
    maxSockets: 25, // Reduced from default 50
  },
});

/**
 * delete an S3 bucket, copied from amplify-e2e-core
 */
const deleteS3Bucket = async (bucket: string, providedS3Client: S3Client | undefined = undefined) => {
  const s3 = providedS3Client || new S3Client({});
  let continuationToken: string | undefined = undefined;
  const objectKeyAndVersion: { Key: string; VersionId?: string }[] = [];
  let truncated = true;
  while (truncated) {
    const results = await s3.send(
      new ListObjectVersionsCommand({
        Bucket: bucket,
        ...(continuationToken ? { KeyMarker: continuationToken } : {}),
      }),
    );

    results.Versions?.forEach(({ Key, VersionId }) => {
      if (Key) {
        objectKeyAndVersion.push({ Key, VersionId });
      }
    });

    results.DeleteMarkers?.forEach(({ Key, VersionId }) => {
      if (Key) {
        objectKeyAndVersion.push({ Key, VersionId });
      }
    });

    continuationToken = results.NextKeyMarker;
    truncated = !!results.IsTruncated;
  }
  const chunkedResult = _.chunk(objectKeyAndVersion, 1000);
  const deleteReq = chunkedResult
    .map((r) => ({
      Bucket: bucket,
      Delete: {
        Objects: r,
        Quiet: true,
      },
    }))
    .map((delParams) => s3.send(new DeleteObjectsCommand(delParams)));
  await Promise.all(deleteReq);
  await s3.send(
    new DeleteBucketCommand({
      Bucket: bucket,
    }),
  );
  await bucketNotExists(bucket);
};

/**
 * Copied from amplify-e2e-core
 */
const bucketNotExists = async (bucket: string) => {
  const s3 = new S3Client({});
  const maxAttempts = 10;
  const delay = 30000; // 30 seconds

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      await s3.send(new ListObjectsV2Command({ Bucket: bucket, MaxKeys: 1 }));
      // If we get here, bucket still exists
      if (attempt < maxAttempts - 1) {
        await sleep(delay);
        continue;
      }
      return false;
    } catch (error: any) {
      if (error.name === 'NoSuchBucket') {
        return true;
      }
      if (error.$metadata?.httpStatusCode === 404) {
        return true;
      }
      if (attempt < maxAttempts - 1) {
        await sleep(delay);
        continue;
      }
      throw error;
    }
  }
  return false;
};

/**
 * Copied from amplify-e2e-core
 */
const sleep = async (milliseconds: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, milliseconds));

/**
 * Returns a list of Amplify Apps in the region. The apps includes information about the CircleCI build that created the app
 * This is determined by looking at tags of the backend environments that are associated with the Apps
 * @param account aws account to query for amplify Apps
 * @param region aws region to query for amplify Apps
 * @returns Promise<AmplifyAppInfo[]> a list of Amplify Apps in the region with build info
 */
const getAmplifyApps = async (account: AWSAccountInfo, region: string, cbClient: CodeBuildClient): Promise<AmplifyAppInfo[]> => {
  if (region === 'us-east-1' && account.parent) {
    return []; // temporarily disabled until us-east-1 is re-enabled for this account
  }
  const amplifyClient = new AmplifyClient(getAWSConfig(account, region));
  try {
    const amplifyApps = await amplifyClient.send(new ListAppsCommand({ maxResults: 25 })); // keeping it to 25 as max supported is 25
    const result: AmplifyAppInfo[] = [];
    for (const app of amplifyApps.apps) {
      if (!isStale(app.createTime)) {
        continue; // skip
      }
      const backends: Record<string, StackInfo> = {};
      try {
        const backendEnvironments = await amplifyClient.send(new ListBackendEnvironmentsCommand({ appId: app.appId, maxResults: 5 }));
        for (const backendEnv of backendEnvironments.backendEnvironments) {
          if (backendEnv.stackName) {
            const buildInfo = await getStackDetails(backendEnv.stackName, account, region, cbClient);
            if (buildInfo) {
              backends[backendEnv.environmentName!] = buildInfo;
            }
          }
        }
      } catch (e) {
        // console.log(e);
      }
      result.push({
        appId: app.appId!,
        name: app.name!,
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
 * Return the job id looking at `codebuild:build_id` in the tags
 * @param tags Tags associated with the resource
 * @returns build number or undefined
 */
const getJobId = (tags: Tag[] = []): string | undefined => {
  const jobId = tags.find((tag) => tag.Key === 'codebuild:build_id')?.Value;
  return jobId;
};

/**
 * Gets details about a stack and CI job that created the stack. If a stack has status of
 * `DELETE_FAILED` then it also includes the list of physical id of resources that caused
 * deletion failures
 *
 * @param stackName name of the stack
 * @param account account
 * @param region region
 * @returns stack details
 */
const getStackDetails = async (
  stackName: string,
  account: AWSAccountInfo,
  region: string,
  cbClient: CodeBuildClient,
): Promise<StackInfo> => {
  const cfnClient = new CloudFormationClient(getAWSConfig(account, region));
  const stack = await cfnClient.send(new DescribeStacksCommand({ StackName: stackName }));
  const tags = stack?.Stacks?.[0].Tags ?? [];
  const stackStatus = stack?.Stacks?.[0]?.StackStatus ?? 'UNDEFINED';
  let resourcesFailedToDelete: string[] = [];
  if (stackStatus === 'DELETE_FAILED') {
    // Todo: We need to investigate if we should go ahead and remove the resources to prevent account getting cluttered
    const resources = await cfnClient.send(new ListStackResourcesCommand({ StackName: stackName }));
    resourcesFailedToDelete =
      resources?.StackResourceSummaries?.filter((r) => r.ResourceStatus === 'DELETE_FAILED').map((r) => r.LogicalResourceId!) ?? [];
  }
  const jobId = getJobId(tags);
  return {
    stackName,
    stackStatus,
    resourcesFailedToDelete,
    region,
    tags: tags.reduce((acc, tag) => ({ ...acc, [tag.Key!]: tag.Value }), {}),
    cbInfo: jobId ? await getCIJobDetails(jobId, cbClient) : undefined,
  };
};

const getStacks = async (account: AWSAccountInfo, region: string, cbClient: CodeBuildClient): Promise<StackInfo[]> => {
  const cfnClient = new CloudFormationClient(getAWSConfig(account, region));
  const stackStatusFilter = [
    StackStatus.CREATE_COMPLETE,
    StackStatus.ROLLBACK_FAILED,
    StackStatus.ROLLBACK_COMPLETE,
    StackStatus.DELETE_FAILED,
    StackStatus.UPDATE_COMPLETE,
    StackStatus.UPDATE_ROLLBACK_FAILED,
    StackStatus.UPDATE_ROLLBACK_COMPLETE,
    StackStatus.IMPORT_COMPLETE,
    StackStatus.IMPORT_ROLLBACK_FAILED,
    StackStatus.IMPORT_ROLLBACK_COMPLETE,
  ];
  const stacks = await cfnClient.send(
    new ListStacksCommand({
      StackStatusFilter: stackStatusFilter,
    }),
  );
  // loop
  let nextToken = stacks.NextToken;
  while (nextToken && stacks?.StackSummaries?.length && stacks.StackSummaries.length < DELETE_LIMITS.PER_REGION.CFN_STACK) {
    const nextPage = await cfnClient.send(
      new ListStacksCommand({
        StackStatusFilter: stackStatusFilter,
        NextToken: nextToken,
      }),
    );
    if (nextPage?.StackSummaries?.length) {
      stacks.StackSummaries.push(...nextPage.StackSummaries);
      nextToken = nextPage.NextToken;
    }
  }

  stacks.StackSummaries = stacks.StackSummaries || [];

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
      const details = await getStackDetails(stack.StackName!, account, region, cbClient);
      if (details) {
        results.push(details);
      }
    } catch {
      // don't want to barf and fail e2e tests
    }
  }
  return results;
};

const getCIJobDetails = async (build_id: string, cbClient: CodeBuildClient): Promise<Build | undefined> => {
  const batchBuilds = await cbClient.send(new BatchGetBuildsCommand({ ids: [build_id] }));
  const buildInfo = batchBuilds?.builds?.[0];

  return buildInfo;
};

const getS3Buckets = async (account: AWSAccountInfo, cbClient: CodeBuildClient): Promise<S3BucketInfo[]> => {
  const s3Client = new S3Client(getAWSConfig(account));
  const buckets = await s3Client.send(new ListBucketsCommand({}));
  if (buckets.Buckets === undefined) {
    return [];
  }
  const result: S3BucketInfo[] = [];
  for (const bucket of buckets.Buckets) {
    if (!bucket.Name) {
      continue;
    }
    try {
      const locationResponse = await s3Client.send(new GetBucketLocationCommand({ Bucket: bucket.Name }));
      const bucketRegion = locationResponse.LocationConstraint || 'us-east-1';
      const bucketS3Client = new S3Client(getAWSConfig(account, bucketRegion));
      const bucketDetails = await bucketS3Client.send(new GetBucketTaggingCommand({ Bucket: bucket.Name }));
      const jobId = getJobId(bucketDetails.TagSet);
      if (jobId) {
        result.push({
          name: bucket.Name,
          cbInfo: await getCIJobDetails(jobId, cbClient),
          createTime: bucket.CreationDate,
        });
      }
    } catch (e) {
      if (e.name !== 'NoSuchTagSet' && e.name !== 'NoSuchBucket') {
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
 * extract and moves CI job details
 */
const extractCIJobInfo = (record: S3BucketInfo | StackInfo | AmplifyAppInfo): CIJobInfo => ({
  workflowId: _.get(record, ['0', 'cbInfo', 'workflows', 'workflow_id']),
  workflowName: _.get(record, ['0', 'cbInfo', 'workflows', 'workflow_name']),
  buildStatus: _.get(record, ['0', 'cbInfo', 'buildStatus']),
  ciJobDetails: _.get(record, ['0', 'cbInfo']),
});

/**
 * Merges stale resources and returns a list grouped by the CI jobId. Amplify Apps that don't have
 * any backend environment are grouped as Orphan apps and apps that have Backend created by different CI jobs are
 * grouped as MULTI_JOB_APP. Any resource that do not have a CI job is grouped under UNKNOWN
 */
const mergeResourcesByCIJob = (
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

  const stacksByJobId = _.groupBy(cfnStacks, (stack: StackInfo) => _.get(stack, ['cbInfo', 'id'], UNKNOWN));

  const bucketByJobId = _.groupBy(s3Buckets, (bucketInfo: S3BucketInfo) => _.get(bucketInfo, ['cbInfo', 'id'], UNKNOWN));

  const amplifyAppByJobId = _.groupBy(amplifyApp, (appInfo: AmplifyAppInfo) => {
    if (Object.keys(appInfo.backends).length === 0) {
      return ORPHAN;
    }

    const buildIds = _.groupBy(appInfo.backends, (backendInfo: StackInfo) => _.get(backendInfo, ['cbInfo', 'id'], UNKNOWN));
    if (Object.keys(buildIds).length === 1) {
      return Object.keys(buildIds)[0];
    }

    return MULTI_JOB_APP;
  });

  _.mergeWith(
    result,
    _.pickBy(amplifyAppByJobId, (__: unknown, key: string) => key !== MULTI_JOB_APP),
    (val: any, src: AmplifyAppInfo, key: string) => ({
      ...val,
      ...extractCIJobInfo(src),
      jobId: key,
      amplifyApps: src,
    }),
  );

  _.mergeWith(
    result,
    stacksByJobId,
    (__: unknown, key: string) => key !== ORPHAN,
    (val: any, src: StackInfo, key: string) => ({
      ...val,
      ...extractCIJobInfo(src),
      jobId: key,
      stacks: src,
    }),
  );

  _.mergeWith(result, bucketByJobId, (val: any, src: S3BucketInfo, key: string) => ({
    ...val,
    ...extractCIJobInfo(src),
    jobId: key,
    buckets: src,
  }));

  const orphanBuckets = {
    [ORPHAN]: orphanS3Buckets,
  };

  _.mergeWith(result, orphanBuckets, (val: any, src: S3BucketInfo, key: string) => ({
    ...val,
    jobId: key,
    buckets: src,
  }));

  const orphanIamRolesGroup = {
    [ORPHAN]: orphanIamRoles,
  };

  _.mergeWith(result, orphanIamRolesGroup, (val: any, src: IamRoleInfo, key: string) => ({
    ...val,
    jobId: key,
    roles: src,
  }));

  const orphanPinpointApps = {
    [ORPHAN]: orphanPinpointApplications,
  };

  _.mergeWith(result, orphanPinpointApps, (val: any, src: PinpointAppInfo, key: string) => ({
    ...val,
    jobId: key,
    pinpointApps: src,
  }));

  _.mergeWith(
    result,
    {
      [ORPHAN]: orphanAppSyncApis,
    },
    (val: any, src: AppSyncApiInfo, key: string) => ({
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
    (val: any, src: UserPoolInfo, key: string) => ({
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
  const amplifyClient = new AmplifyClient(getAWSConfig(account, region));
  try {
    await amplifyClient.send(new DeleteAppCommand({ appId }));
  } catch (e) {
    console.log(`[ACCOUNT ${accountIndex}] Deleting Amplify App ${appId} failed with the following error`, e);
    if (e.name === 'ExpiredTokenException') {
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
    const iamClient = new IAMClient(getAWSConfig(account));
    await deleteAttachedRolePolicies(account, accountIndex, roleName);
    await deleteRolePolicies(account, accountIndex, roleName);
    await iamClient.send(new DeleteRoleCommand({ RoleName: roleName }));
  } catch (e) {
    console.log(`[ACCOUNT ${accountIndex}] Deleting iam role ${roleName} failed with error ${e.message}`);
    if (e.name === 'ExpiredTokenException') {
      handleExpiredTokenException();
    }
  }
};

const deleteAttachedRolePolicies = async (account: AWSAccountInfo, accountIndex: number, roleName: string): Promise<void> => {
  const iamClient = new IAMClient(getAWSConfig(account));
  const rolePolicies = await iamClient.send(new ListAttachedRolePoliciesCommand({ RoleName: roleName }));
  if (rolePolicies?.AttachedPolicies) {
    await Promise.all(rolePolicies.AttachedPolicies.map((policy) => detachIamAttachedRolePolicy(account, accountIndex, roleName, policy)));
  }
};

const detachIamAttachedRolePolicy = async (
  account: AWSAccountInfo,
  accountIndex: number,
  roleName: string,
  policy: AttachedPolicy,
): Promise<void> => {
  if (policy?.PolicyArn) {
    try {
      console.log(`[ACCOUNT ${accountIndex}] Detach Iam Attached Role Policy ${policy.PolicyName}`);
      const iamClient = new IAMClient(getAWSConfig(account));
      await iamClient.send(new DetachRolePolicyCommand({ RoleName: roleName, PolicyArn: policy.PolicyArn }));
    } catch (e) {
      console.log(`[ACCOUNT ${accountIndex}] Detach iam role policy ${policy.PolicyName} failed with error ${e.message}`);
      if (e.name === 'ExpiredTokenException') {
        handleExpiredTokenException();
      }
    }
  }
};

const deleteRolePolicies = async (account: AWSAccountInfo, accountIndex: number, roleName: string): Promise<void> => {
  const iamClient = new IAMClient(getAWSConfig(account));
  const rolePolicies = await iamClient.send(new ListRolePoliciesCommand({ RoleName: roleName }));
  await Promise.all(rolePolicies.PolicyNames.map((policy) => deleteIamRolePolicy(account, accountIndex, roleName, policy)));
};

const deleteIamRolePolicy = async (account: AWSAccountInfo, accountIndex: number, roleName: string, policyName: string): Promise<void> => {
  try {
    console.log(`[ACCOUNT ${accountIndex}] Deleting Iam Role Policy ${policyName}`);
    const iamClient = new IAMClient(getAWSConfig(account));
    await iamClient.send(new DeleteRolePolicyCommand({ RoleName: roleName, PolicyName: policyName }));
  } catch (e) {
    console.log(`[ACCOUNT ${accountIndex}] Deleting iam role policy ${policyName} failed with error ${e.message}`);
    if (e.name === 'ExpiredTokenException') {
      handleExpiredTokenException();
    }
  }
};

const deleteBuckets = async (account: AWSAccountInfo, accountIndex: number, buckets: S3BucketInfo[]): Promise<void> => {
  await Promise.all(buckets.slice(0, DELETE_LIMITS.PER_BATCH.OTHER).map((bucket) => deleteBucket(account, accountIndex, bucket)));
};

const deleteBucket = async (account: AWSAccountInfo, accountIndex: number, bucket: S3BucketInfo): Promise<void> => {
  const { createTime, name } = bucket;
  if (name) {
    try {
      console.log(`[ACCOUNT ${accountIndex}] Deleting S3 Bucket ${name}`);
      console.log(`Bucket creation time (PST): ${createTime?.toLocaleTimeString('en-US', { timeZone: 'America/Los_Angeles' })}`);
      const s3 = new S3Client(getAWSConfig(account));
      const locationResponse = await s3.send(new GetBucketLocationCommand({ Bucket: name }));
      const bucketRegion = locationResponse.LocationConstraint || 'us-east-1';
      const regionalS3Client = new S3Client(getAWSConfig(account, bucketRegion));
      await deleteS3Bucket(name, regionalS3Client);
    } catch (e) {
      console.log(`[ACCOUNT ${accountIndex}] Deleting bucket ${name} failed with error ${e.message}`);
      if (e.name === 'ExpiredTokenException') {
        handleExpiredTokenException();
      }
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
    const pinpoint = new PinpointClient(getAWSConfig(account, region));
    await pinpoint.send(new DeletePinpointAppCommand({ ApplicationId: id }));
  } catch (e) {
    console.log(`[ACCOUNT ${accountIndex}] Deleting pinpoint app ${name} failed with error ${e.message}`);
  }
};

const deleteAppSyncApis = async (account: AWSAccountInfo, accountIndex: number, apis: AppSyncApiInfo[]): Promise<void> => {
  await Promise.all(apis.slice(0, DELETE_LIMITS.PER_BATCH.OTHER).map((api) => deleteAppSyncApi(account, accountIndex, api)));
};

const deleteAppSyncApi = async (account: AWSAccountInfo, accountIndex: number, api: AppSyncApiInfo): Promise<void> => {
  const { apiId, name, region } = api;
  if (apiId) {
    try {
      console.log(`[ACCOUNT ${accountIndex}] Deleting AppSync Api ${name}`);
      const appSync = new AppSyncClient(getAWSConfig(account, region));
      await appSync.send(new DeleteGraphqlApiCommand({ apiId }));
    } catch (e) {
      console.log(`[ACCOUNT ${accountIndex}] Deleting AppSync Api ${name} failed with error ${e.message}`);
    }
  }
};

const deleteUserPools = async (account: AWSAccountInfo, accountIndex: number, userPools: UserPoolInfo[]): Promise<void> => {
  await Promise.all(userPools.slice(0, DELETE_LIMITS.PER_BATCH.OTHER).map((userPool) => deleteUserPool(account, accountIndex, userPool)));
};

const deleteUserPool = async (account: AWSAccountInfo, accountIndex: number, userPool: UserPoolInfo): Promise<void> => {
  const { name, region, userPoolId } = userPool;
  if (!userPoolId) {
    return;
  }
  try {
    console.log(`[ACCOUNT ${accountIndex}] Deleting UserPool ${name}`);
    const cognitoClient = new CognitoIdentityProviderClient(getAWSConfig(account, region));
    const userPoolDetails = await cognitoClient.send(new DescribeUserPoolCommand({ UserPoolId: userPoolId }));
    if (userPoolDetails?.UserPool?.Domain) {
      await cognitoClient.send(
        new DeleteUserPoolDomainCommand({
          UserPoolId: userPoolId,
          Domain: userPoolDetails.UserPool.Domain,
        }),
      );
    }
    await cognitoClient.send(new DeleteUserPoolCommand({ UserPoolId: userPoolId }));
  } catch (e) {
    console.log(`[ACCOUNT ${accountIndex}] Deleting UserPool ${name} failed with error ${e.message}`);
  }
};

const deleteCfnStacks = async (account: AWSAccountInfo, accountIndex: number, stacks: StackInfo[]): Promise<void> => {
  await Promise.all(stacks.slice(0, DELETE_LIMITS.PER_BATCH.CFN_STACK).map((stack) => deleteCfnStack(account, accountIndex, stack)));
};

const deleteCfnStack = async (account: AWSAccountInfo, accountIndex: number, stack: StackInfo): Promise<void> => {
  const { stackName, region, resourcesFailedToDelete } = stack;
  const resourceToRetain = resourcesFailedToDelete?.length ? resourcesFailedToDelete : undefined;
  console.log(`[ACCOUNT ${accountIndex}] Deleting CloudFormation stack ${stackName}`);
  try {
    const cfnClient = new CloudFormationClient(getAWSConfig(account, region));
    await cfnClient.send(new DeleteStackCommand({ StackName: stackName, RetainResources: resourceToRetain }));
    // we'll only wait up to a minute before moving on
    const maxAttempts = 2;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const result = await cfnClient.send(new DescribeStacksCommand({ StackName: stackName }));
        const stackStatus = result.Stacks?.[0]?.StackStatus;
        if (stackStatus === 'DELETE_COMPLETE') {
          break;
        }
        if (stackStatus === 'DELETE_FAILED') {
          console.log(`Stack ${stackName} deletion failed`);
          break;
        }
        if (attempt < maxAttempts - 1) {
          await sleep(30000); // wait 30 seconds
        }
      } catch (e: any) {
        if (e.name === 'ValidationError' && e.message?.includes('does not exist')) {
          // Stack was deleted successfully
          break;
        }
        throw e;
      }
    }
  } catch (e) {
    console.log(`Deleting CloudFormation stack ${stackName} failed with error ${e.message}`);
    if (e.name === 'ExpiredTokenException') {
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
  const jobIds = Object.keys(staleResources);
  const CONCURRENT_JOBS = 3; // Process 3 jobs concurrently

  for (let i = 0; i < jobIds.length; i += CONCURRENT_JOBS) {
    const batch = jobIds.slice(i, i + CONCURRENT_JOBS);

    await Promise.all(
      batch.map(async (jobId) => {
        const resources = staleResources[jobId];

        // Process resource types sequentially within each job to avoid dependency issues
        if (resources.amplifyApps) {
          console.log(
            `Deleting up to ${DELETE_LIMITS.PER_BATCH.OTHER} of ${resources.amplifyApps.length} apps on ACCOUNT[${accountIndex}]`,
          );
          await deleteAmplifyApps(account, accountIndex, Object.values(resources.amplifyApps));
        }

        if (resources.stacks) {
          console.log(
            `Deleting up to ${DELETE_LIMITS.PER_BATCH.CFN_STACK} of ${resources.stacks.length} stacks on ACCOUNT[${accountIndex}]`,
          );
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
          console.log(
            `Deleting up to ${DELETE_LIMITS.PER_BATCH.OTHER} of ${resources.userPools.length} userPools on ACCOUNT[${accountIndex}]`,
          );
          await deleteUserPools(account, accountIndex, Object.values(resources.userPools));
        }
      }),
    );

    // Add short delay between batches to prevent rate limiting
    if (i + CONCURRENT_JOBS < jobIds.length) {
      await sleep(200);
    }
  }
};

/**
 * Retrieve the accounts to process for potential cleanup. By default we will attempt
 * to get all accounts within the root account organization.
 */
const getAccountsToCleanup = async (): Promise<AWSAccountInfo[]> => {
  const stsRes = new STSClient({
    apiVersion: '2011-06-15',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      sessionToken: process.env.AWS_SESSION_TOKEN!,
    },
  });
  const parentAccountIdentity = await stsRes.send(new GetCallerIdentityCommand({}));
  const orgApi = new OrganizationsClient({
    apiVersion: '2016-11-28',
    // the region where the organization exists
    region: 'us-east-1',
  });
  try {
    const orgAccounts = await orgApi.send(new ListAccountsCommand({}));
    const allAccounts = orgAccounts.Accounts ?? [];
    let nextToken = orgAccounts.NextToken;
    while (nextToken) {
      const nextPage = await orgApi.send(new ListAccountsCommand({ NextToken: nextToken }));
      if (!nextPage?.Accounts?.length) {
        break;
      }
      allAccounts.push(...nextPage.Accounts);
      nextToken = nextPage.NextToken;
    }
    const accountCredentialPromises = allAccounts.map(async (account) => {
      if (account.Id === parentAccountIdentity.Account) {
        return getEnvVarCredentials();
      }
      const randomNumber = Math.floor(Math.random() * 100000);
      const assumeRoleRes = await stsRes.send(
        new AssumeRoleCommand({
          RoleArn: `arn:aws:iam::${account.Id}:role/OrganizationAccountAccessRole`,
          RoleSessionName: `testSession${randomNumber}`,
          // One hour
          DurationSeconds: 1 * 60 * 60,
        }),
      );

      const accessKeyId = assumeRoleRes?.Credentials?.AccessKeyId ?? '';
      const secretAccessKey = assumeRoleRes?.Credentials?.SecretAccessKey ?? '';
      const sessionToken = assumeRoleRes?.Credentials?.SessionToken ?? '';

      return {
        accessKeyId,
        secretAccessKey,
        sessionToken,
        parent: false,
      };
    });
    return await Promise.all(accountCredentialPromises);
  } catch (e) {
    console.error(e);
    console.log(
      'Error assuming child account role. This could be because the script is already running from within a child account. Running on current AWS account only.',
    );

    return [getEnvVarCredentials()];
  }
};

const getEnvVarCredentials = (): AWSAccountInfo => {
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_SESSION_TOKEN) {
    throw Error('Credentials are missing in environment variables');
  }

  return {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
    parent: true,
  };
};

const cleanupAccount = async (account: AWSAccountInfo, accountIndex: number, filterPredicate: JobFilterPredicate): Promise<void> => {
  const cbClient = new CodeBuildClient(getAWSConfig(account));

  // Process regions in smaller batches to avoid memory issues
  const REGION_BATCH_SIZE = 3;
  const regionBatches = [];
  for (let i = 0; i < AWS_REGIONS_TO_RUN_TESTS.length; i += REGION_BATCH_SIZE) {
    regionBatches.push(AWS_REGIONS_TO_RUN_TESTS.slice(i, i + REGION_BATCH_SIZE));
  }

  const apps: AmplifyAppInfo[] = [];
  const stacks: StackInfo[] = [];

  // Process regions in batches
  for (const regionBatch of regionBatches) {
    const appPromises = regionBatch.map((region) => getAmplifyApps(account, region, cbClient));
    const stackPromises = regionBatch.map((region) => getStacks(account, region, cbClient));

    const batchApps = (await Promise.all(appPromises)).flat();
    const batchStacks = (await Promise.all(stackPromises)).flat();

    apps.push(...batchApps);
    stacks.push(...batchStacks);

    // Force cleanup between batches
    if (global.gc) {
      global.gc();
    }
  }

  const buckets = await getS3Buckets(account, cbClient);
  const orphanBuckets = await getOrphanS3TestBuckets(account);
  const orphanIamRoles = await getOrphanTestIamRoles(account);

  // Process Pinpoint regions in batches
  const pinpointRegionBatches = [];
  for (let i = 0; i < AWS_REGIONS_TO_RUN_TESTS_PINPOINT.length; i += REGION_BATCH_SIZE) {
    pinpointRegionBatches.push(AWS_REGIONS_TO_RUN_TESTS_PINPOINT.slice(i, i + REGION_BATCH_SIZE));
  }

  const orphanPinpointApplications: PinpointAppInfo[] = [];
  const orphanAppSyncApis: AppSyncApiInfo[] = [];
  const orphanUserPools: UserPoolInfo[] = [];

  for (const regionBatch of pinpointRegionBatches) {
    const pinpointPromises = regionBatch.map((region) => getOrphanPinpointApplications(account, region));
    const appSyncPromises = regionBatch.map((region) => getOrphanAppSyncApis(account, region));
    const userPoolPromises = regionBatch.map((region) => getOrphanUserPools(account, region));

    const batchPinpoint = (await Promise.all(pinpointPromises)).flat();
    const batchAppSync = (await Promise.all(appSyncPromises)).flat();
    const batchUserPools = (await Promise.all(userPoolPromises)).flat();

    orphanPinpointApplications.push(...batchPinpoint);
    orphanAppSyncApis.push(...batchAppSync);
    orphanUserPools.push(...batchUserPools);

    // Force cleanup between batches
    if (global.gc) {
      global.gc();
    }
  }

  const allResources = mergeResourcesByCIJob(
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
  await deleteOrphanedOidcProviders(account);
  console.log(`[ACCOUNT ${accountIndex}] Cleanup done!`);
};

/**
 * Execute the cleanup script.
 * Cleanup will happen sequentially across accounts to avoid resource exhaustion,
 * based on the requested filter parameters (i.e. for a given workflow, job, or all stale resources).
 * Logs are emitted for given account ids anywhere we've fanned out, but we use an indexing scheme instead
 * of account ids since the logs these are written to will be effectively public.
 */
const cleanup = async (): Promise<void> => {
  const filterPredicateStaleResources = (job: ReportEntry) => job?.cbInfo?.buildStatus !== StatusType.IN_PROGRESS || job.jobId === ORPHAN;
  const accounts = await getAccountsToCleanup();

  // Process accounts sequentially to avoid memory/timeout issues
  for (let accountIndex = 0; accountIndex < accounts.length; accountIndex++) {
    try {
      console.log(`Processing account ${accountIndex + 1}/${accounts.length}`);
      await cleanupAccount(accounts[accountIndex], accountIndex, filterPredicateStaleResources);

      // Force garbage collection and add delay between accounts
      if (global.gc) {
        global.gc();
      }

      // Add a small delay between accounts to allow connection cleanup
      if (accountIndex < accounts.length - 1) {
        await sleep(100);
      }
    } catch (error) {
      console.error(`Failed to cleanup account ${accountIndex}:`, error.message);

      // Force cleanup on error
      if (global.gc) {
        global.gc();
      }
    }
  }

  console.log('Done cleaning all accounts!');
};

void cleanup();
