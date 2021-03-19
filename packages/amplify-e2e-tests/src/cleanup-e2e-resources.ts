import { CircleCI, GitType, CircleCIOptions } from 'circleci-api';
import { config } from 'dotenv';
import yargs from 'yargs';
import * as aws from 'aws-sdk';
import _ from 'lodash';
import fs from 'fs-extra';
import path from 'path';
import { deleteS3Bucket } from 'amplify-e2e-core';

// Ensure to update scripts/split-e2e-tests.ts is also updated this gets updated
const AWS_REGIONS_TO_RUN_TESTS = [
  'us-east-2',
  'us-west-2',
  'eu-west-2',
  'eu-central-1',
  'ap-northeast-1',
  'ap-southeast-1',
  'ap-southeast-2',
];

const reportPath = path.normalize(path.join(__dirname, '..', 'amplify-e2e-reports', 'stale-resources.json'));

const MULTI_JOB_APP = '<Amplify App reused by multiple apps>';
const ORPHAN = '<orphan>';
const UNKNOWN = '<unknown>';

type CircleCIJobDetails = {
  build_url: string;
  branch: string;
  build_num: number;
  outcome: string;
  canceled: string;
  infrastructure_fail: boolean;
  status: string;
  committer_name: null;
  workflows: { workflow_id: string };
};

type StackInfo = {
  stackName: string;
  stackStatus: string;
  resourcesFailedToDelete?: string[];
  tags: Record<string, string>;
  region: string;
  cciInfo: CircleCIJobDetails;
};

type AmplifyAppInfo = {
  appId: string;
  name: string;
  region: string;
  backends: Record<string, StackInfo>;
};

type S3BucketInfo = {
  name: string;
  cciInfo?: CircleCIJobDetails;
};

type ReportEntry = {
  jobId?: string;
  workflowId?: string;
  lifecycle?: string;
  cciJobDetails?: CircleCIJobDetails;
  amplifyApps: Record<string, AmplifyAppInfo>;
  stacks: Record<string, StackInfo>;
  buckets: Record<string, S3BucketInfo>;
};

/**
 * Configure the AWS SDK with credentials and retry
 */
const configureAws = (): void => {
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    throw new Error('AWS credentials are not configured. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables');
  }

  aws.config.update({
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      ...(process.env.AWS_SESSION_TOKEN ? { sessionToken: process.env.AWS_SESSION_TOKEN } : {}),
    },
    maxRetries: 10,
  });
};

/**
 * Returns a list of Amplify Apps in the region. The apps includes information about the CircleCI build that created the app
 * This is determined by looking at tags of the backend environments that are associated with the Apps
 * @param region aws region to query for amplify Apps
 * @returns Promise<AmplifyAppInfo[]> a list of Amplify Apps in the region with build info
 */
const getAmplifyApps = async (region: string): Promise<AmplifyAppInfo[]> => {
  const amplifyClient = new aws.Amplify({ region });
  const amplifyApps = await amplifyClient.listApps({ maxResults: 50 }).promise(); // keeping it to 50 as max supported is 50
  const result: AmplifyAppInfo[] = [];
  for (const app of amplifyApps.apps) {
    const backends: Record<string, StackInfo> = {};
    try {
      const backendEnvironments = await amplifyClient.listBackendEnvironments({ appId: app.appId, maxResults: 50 }).promise();
      for (const backendEnv of backendEnvironments.backendEnvironments) {
        const buildInfo = await getStackDetails(backendEnv.stackName, region);
        if (buildInfo) {
          backends[backendEnv.environmentName] = buildInfo;
        }
      }
    } catch (e) {
      console.log(e);
    }
    result.push({
      appId: app.appId,
      name: app.name,
      region,
      backends,
    });
  }
  return result;
};

/**
 * Return the CircleCI job id looking at `circleci:build_id` in the tags
 * @param tags Tags associated with the resource
 * @returns build number or undefined
 */
export const getJobId = (tags: aws.CloudFormation.Tags = []): number | undefined => {
  const jobId = tags.find(tag => tag.Key === 'circleci:build_id')?.Value;
  return jobId && Number.parseInt(jobId, 10);
};

/**
 * Gets detail about a stack including the details about CircleCI job that created the stack. If a stack
 * has status of `DELETE_FAILED` then it also includes the list of physical id of resources that caused
 * deletion failures
 *
 * @param stackName name of the stack
 * @param region region
 * @returns stack details
 */
const getStackDetails = async (stackName: string, region: string): Promise<StackInfo | void> => {
  const cfnClient = new aws.CloudFormation({ region });
  const stack = await cfnClient.describeStacks({ StackName: stackName }).promise();
  const tags = stack.Stacks.length && stack.Stacks[0].Tags;
  const stackStatus = stack.Stacks[0].StackStatus;
  let resourcesFailedToDelete: string[] = [];
  if (stackStatus === 'DELETE_FAILED') {
    //Todo: We need to investigate if we should go ahead and remove the resources to prevent account getting cluttered
    const resources = await cfnClient.listStackResources({ StackName: stackName }).promise();
    resourcesFailedToDelete = resources.StackResourceSummaries.filter(r => r.ResourceStatus === 'DELETE_FAILED').map(
      r => r.LogicalResourceId,
    );
  }
  const jobId = getJobId(tags);
  return {
    stackName,
    stackStatus,
    resourcesFailedToDelete,
    region,
    tags: tags.reduce((acc, tag) => ({ ...acc, [tag.Key]: tag.Value }), {}),
    cciInfo: jobId && (await getJobCircleCIDetails(jobId)),
  };
};

const getStacks = async (region: string): Promise<StackInfo[]> => {
  const cfnClient = new aws.CloudFormation({ region });
  const stacks = await cfnClient
    .listStacks({
      StackStatusFilter: [
        'CREATE_COMPLETE',
        'ROLLBACK_FAILED',
        'DELETE_FAILED',
        'UPDATE_COMPLETE',
        'UPDATE_ROLLBACK_FAILED',
        'UPDATE_ROLLBACK_COMPLETE',
        'IMPORT_COMPLETE',
        'IMPORT_ROLLBACK_FAILED',
        'IMPORT_ROLLBACK_COMPLETE',
      ],
    })
    .promise();

  // We are interested in only the root stacks that are deployed by amplify-cli
  const rootStacks = stacks.StackSummaries.filter(stack => !stack.RootId);
  const results: StackInfo[] = [];
  for (const stack of rootStacks) {
    try {
      const details = await getStackDetails(stack.StackName, region);
      details && results.push(details);
    } catch {
      // don't want to barf and fail e2e tests
    }
  }
  return results;
};

const getCircleCIClient = (): CircleCI => {
  const options: CircleCIOptions = {
    token: process.env.CIRCLECI_TOKEN,
    vcs: {
      repo: process.env.CIRCLE_PROJECT_REPONAME,
      owner: process.env.CIRCLE_PROJECT_USERNAME,
      type: GitType.GITHUB,
    },
  };
  return new CircleCI(options);
};

export const getJobCircleCIDetails = async (jobId: number): Promise<CircleCIJobDetails> => {
  const client = getCircleCIClient();
  const result = await client.build(jobId);

  const r = (_.pick(result, [
    'build_url',
    'branch',
    'build_num',
    'outcome',
    'canceled',
    'infrastructure_fail',
    'status',
    'committer_name',
    'workflows.workflow_id',
    'lifecycle',
  ]) as any) as CircleCIJobDetails;
  return r;
};

export const getS3Buckets = async (): Promise<S3BucketInfo[]> => {
  const s3Client = new aws.S3();
  const buckets = await s3Client.listBuckets().promise();
  const result: S3BucketInfo[] = [];
  for (const bucket of buckets.Buckets) {
    try {
      const bucketDetails = await s3Client.getBucketTagging({ Bucket: bucket.Name }).promise();
      const jobId = getJobId(bucketDetails.TagSet);
      if (jobId) {
        result.push({
          name: bucket.Name,
          cciInfo: await getJobCircleCIDetails(jobId),
        });
      }
    } catch (e) {
      if (e.code !== 'NoSuchTagSet' && e.code !== 'NoSuchBucket') {
        throw e;
      }
      result.push({
        name: bucket.Name,
      });
    }
  }
  return result;
};

/**
 * extract and moves CircleCI job details
 * @param record
 * @returns
 */
export const extractCCIJobInfo = (record: S3BucketInfo | StackInfo | AmplifyAppInfo) => {
  return {
    workflowId: _.get(record, ['0', 'cciInfo', 'workflows', 'workflow_id']),
    workflowName: _.get(record, ['0', 'cciInfo', 'workflows', 'workflow_name']),
    lifecycle: _.get(record, ['0', 'cciInfo', 'lifecycle']),
    cciJobDetails: _.get(record, ['0', 'cciInfo']),
    status: _.get(record, ['0', 'cciInfo', 'status']),
  };
};

/**
 * Merges stale resources and returns a list grouped by the CircleCI jobId. Amplify Apps that don't have
 * any backend environment are grouped as Orphan apps and apps that have Backend created by different CircleCI jobs are
 * grouped as MULTI_JOB_APP. Any resource that do not have a CircleCI job is grouped under UNKNOWN
 * @param amplifyApp list of AmplifyApps
 * @param cfnStacks list of Cloudformation stacks
 * @param s3Buckets list of S3 Buckets
 * @returns
 */
export const mergeResourcesByCCIJob = (
  amplifyApp: AmplifyAppInfo[],
  cfnStacks: StackInfo[],
  s3Buckets: S3BucketInfo[],
): Record<string, ReportEntry> => {
  const result: Record<string, ReportEntry> = {};

  const stacksByJobId = _.groupBy(cfnStacks, (stack: StackInfo) => {
    return _.get(stack, ['cciInfo', 'build_num'], UNKNOWN);
  });

  const bucketByJobId = _.groupBy(s3Buckets, (bucketInfo: S3BucketInfo) => {
    return _.get(bucketInfo, ['cciInfo', 'build_num'], UNKNOWN);
  });

  const amplifyAppByJobId = _.groupBy(amplifyApp, (appInfo: AmplifyAppInfo) => {
    if (Object.keys(appInfo.backends).length === 0) {
      return ORPHAN;
    }

    const buildIds = _.groupBy(appInfo.backends, backendInfo => _.get(backendInfo, ['cciInfo', 'build_num'], UNKNOWN));
    if (Object.keys(buildIds).length === 1) {
      return Object.keys(buildIds)[0];
    }

    return MULTI_JOB_APP;
  });

  _.mergeWith(
    result,
    _.pickBy(amplifyAppByJobId, (_, key) => key !== MULTI_JOB_APP),
    (val, src, key) => {
      return {
        ...val,
        ...extractCCIJobInfo(src),
        jobId: key,
        amplifyApps: src,
      };
    },
  );

  _.mergeWith(
    result,
    stacksByJobId,
    (_, key) => key !== ORPHAN,
    (val, src, key) => {
      return {
        ...val,
        ...extractCCIJobInfo(src),
        jobId: key,
        stacks: src,
      };
    },
  );

  _.mergeWith(result, bucketByJobId, (val, src, key) => {
    return {
      ...val,
      ...extractCCIJobInfo(src),
      jobId: key,
      buckets: src,
    };
  });

  return result;
};

export const deleteAmplifyApps = async (apps: AmplifyAppInfo[]): Promise<void> => {
  for (const appInfo of apps) {
    console.log(`Deleting App ${appInfo.name}(${appInfo.appId})`);
    await deleteAmplifyApp(appInfo.appId, appInfo.region);
  }
};

export const deleteAmplifyApp = async (appId: string, region: string): Promise<void> => {
  const amplifyClient = new aws.Amplify({ region });
  try {
    await amplifyClient.deleteApp({ appId: appId }).promise();
  } catch (e) {
    console.log(`Deleting Amplify App ${appId} failed with the following error`, e);
  }
};

export const deleteBuckets = async (buckets: S3BucketInfo[]): Promise<void> => {
  for (const bucketInfo of buckets) {
    try {
      console.log(`Deleting S3 Bucket ${bucketInfo.name}`);
      await deleteS3Bucket(bucketInfo.name);
    } catch (e) {
      console.log(`Deleting bucket ${bucketInfo.name} failed with error ${e.message}`);
    }
  }
};

export const deleteCfnStacks = async (stacks: StackInfo[]): Promise<void> => {
  for (const stackInfo of stacks) {
    try {
      console.log(`Deleting CloudFormation stack ${stackInfo.stackName}`);
      await deleteCfnStack(
        stackInfo.stackName,
        stackInfo.region,
        stackInfo.resourcesFailedToDelete.length ? stackInfo.resourcesFailedToDelete : undefined,
      );
    } catch (e) {
      console.log(`Deleting CloudFormation stack ${stackInfo.stackName} failed with error ${e.message}`);
    }
  }
};

export const deleteCfnStack = async (stackName: string, region: string, resourceToRetain?: string[]): Promise<void> => {
  const cfnClient = new aws.CloudFormation({ region });
  await cfnClient.deleteStack({ StackName: stackName, RetainResources: resourceToRetain }).promise();
  await cfnClient.waitFor('stackDeleteComplete', { StackName: stackName }).promise();
};

const generateReport = jobs => {
  fs.ensureFileSync(reportPath);
  fs.writeFileSync(reportPath, JSON.stringify(jobs, null, 4));
};

export const filterByJobId = (jobId: string) => (job: ReportEntry) => job.jobId === jobId;

export const filterByWorkflowId = (workflowId: string) => (job: ReportEntry) => job.workflowId === workflowId;

export const filterAllStaleResources = () => (job: ReportEntry) => job.lifecycle === 'finished' || job.jobId === ORPHAN;

export const deleteResources = async (staleResources: Record<string, ReportEntry>): Promise<void> => {
  for (const jobId of Object.keys(staleResources)) {
    const resources = staleResources[jobId];
    if (resources.amplifyApps) {
      await deleteAmplifyApps(Object.values(resources.amplifyApps));
    }

    if (resources.stacks) {
      await deleteCfnStacks(Object.values(resources.stacks));
    }

    if (resources.buckets) {
      await deleteBuckets(Object.values(resources.buckets));
    }
  }
};

export const cleanup = async () => {
  const args = yargs
    .command('*', 'clean up all the stale resources')
    .command('workflow <workflow-id>', 'clean all the resources created by workflow', yargs => {
      yargs.positional('workflowId', {
        describe: 'Workflow Id of the workflow',
        type: 'string',
        demandOption: '',
      });
    })
    .command('job <jobId>', 'clean all the resource created by a job', yargs => {
      yargs.positional('jobId', {
        describe: 'job id of the job',
        type: 'number',
      });
    })
    .help().argv;
  config();
  configureAws();

  let filterPredicate;
  if (args._.length === 0) {
    filterPredicate = filterAllStaleResources();
  } else {
    if (args._[0] === 'workflow') {
      filterPredicate = filterByWorkflowId(args.workflowId as string);
    } else if (args._[0] === 'job') {
      if (Number.isNaN(args.jobId)) {
        throw new Error('job-id should be integer');
      }
      filterPredicate = filterByJobId((args.jobId as number).toString());
    }
  }
  const amplifyApps: AmplifyAppInfo[] = [];
  const stacks: StackInfo[] = [];

  for (const region of AWS_REGIONS_TO_RUN_TESTS) {
    amplifyApps.push(...(await getAmplifyApps(region)));
    stacks.push(...(await getStacks(region)));
  }

  const buckets = await getS3Buckets();
  const allResources = mergeResourcesByCCIJob(amplifyApps, stacks, buckets);
  const staleResources = _.pickBy(allResources, filterPredicate);
  generateReport(staleResources);
  await deleteResources(staleResources);

  console.log('Cleanup done!');
};

cleanup();
