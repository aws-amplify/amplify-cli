import { CircleCIConfig, WorkflowJob } from './cci-types';
import { FORCE_US_WEST_2, getOldJobNameWithoutSuffixes, loadTestTimings, USE_PARENT_ACCOUNT } from './cci-utils';
import { AWS_REGIONS_TO_RUN_TESTS as regions, getTestFiles } from './cci-utils';
const RUN_SOLO = [
  'src/__tests__/auth_2c.test.ts',
  'src/__tests__/auth_2e.test.ts',
  'src/__tests__/containers-api-1.test.ts',
  'src/__tests__/containers-api-2.test.ts',
  'src/__tests__/env-3.test.ts',
  'src/__tests__/geo-add-e.test.ts',
  'src/__tests__/geo-add-f.test.ts',
  'src/__tests__/geo-remove-1.test.ts',
  'src/__tests__/geo-remove-2.test.ts',
  'src/__tests__/geo-remove-3.test.ts',
  'src/__tests__/geo-update-1.test.ts',
  'src/__tests__/geo-update-2.test.ts',
  'src/__tests__/import_auth_1a.test.ts',
  'src/__tests__/import_auth_1b.test.ts',
  'src/__tests__/import_auth_2a.test.ts',
  'src/__tests__/import_auth_2b.test.ts',
  'src/__tests__/import_auth_3.test.ts',
  'src/__tests__/import_dynamodb_1.test.ts',
  'src/__tests__/import_dynamodb_2a.test.ts',
  'src/__tests__/import_dynamodb_2b.test.ts',
  'src/__tests__/import_dynamodb_2c.test.ts',
  'src/__tests__/import_s3_1.test.ts',
  'src/__tests__/import_s3_2a.test.ts',
  'src/__tests__/import_s3_2b.test.ts',
  'src/__tests__/import_s3_2c.test.ts',
  'src/__tests__/import_s3_3.test.ts',
  'src/__tests__/notifications-in-app-messaging.test.ts',
  'src/__tests__/schema-auth-11-a.test.ts',
  'src/__tests__/schema-auth-15.test.ts',
  'src/__tests__/schema-connection-1.test.ts',
];
/**
 * Most Windows tests only run on 'dev', except for this list of smoke tests.
 * This list should contain ~30 high quality tests that provide good overall coverage.
 *
 * All other tests will eventually run on 'dev'.
 */
const WINDOWS_SMOKE_TESTS = [
  // api, lambda, multi-env
  'src/__tests__/api_lambda_auth_1.test.ts',
  // auth with api, trigger, and function that depends on api
  'src/__tests__/auth_2e.test.ts',
  // js with with all auth options
  'src/__tests__/auth_3c.test.ts',
  // headless auth with totp & sms
  'src/__tests__/auth_5b.test.ts',
  // headless auth update resource
  'src/__tests__/auth_5e.test.ts',
  // js with all auth options and front end config
  'src/__tests__/auth_6.test.ts',
  // auth import
  'src/__tests__/auth_7b.test.ts',
  // flutter with auth
  'src/__tests__/auth_8b.test.ts',
  // android
  'src/__tests__/auth_11.test.ts',
  // auth with multiple triggers
  'src/__tests__/auth-trigger.test.ts',
  // configure
  'src/__tests__/congifure-project.test.ts',
  // api with containers and secrets
  'src/__tests__/containers-api-secrets.test.ts',
  // api with dynamodb & lambda, custom policies
  'src/__tests__/custom_policies_function.test.ts',
  // env
  'src/__tests__/env-1.test.ts',
  // export and pull
  'src/__tests__/export-pull-a.test.ts',
  // functions
  'src/__tests__/function_10.test.ts',
  // notifications with function permissions
  'src/__tests__/function-permissions.test.ts',
  // geo
  'src/__tests__/geo-add-a.test.ts',
  // global sandbox
  'src/__tests__/global_sandbox-b.test.ts',
  // hooks
  'src/__tests__/hooks-b.test.ts',
  // hosting
  'src/__tests__/hostingPROD.test.ts',
  // import, s3
  'src/__tests__/import_s3_2b.test.ts',
  // interactions
  'src/__tests__/interactions.test.ts',
  // schema auth test
  'src/__tests__/schema-auth-1a.test.ts',
  // schema model test
  'src/__tests__/schema-model-e.test.ts',
  // interative deployments
  'src/__tests__/schema-iterative-update-1.test.ts',
];
const TEST_EXCLUSIONS: { l: string[]; w: string[] } = {
  l: [],
  w: [
    'src/__tests__/opensearch-simulator/opensearch-simulator.test.ts',
    'src/__tests__/storage-simulator/S3server.test.ts',
    'src/__tests__/dynamodb-simulator/dynamodb-simulator.test.ts',
    'src/__tests__/amplify-app.test.ts',
    'src/__tests__/analytics-2.test.ts',
    'src/__tests__/api_2a.test.ts',
    'src/__tests__/api_2b.test.ts',
    'src/__tests__/api_3.test.ts',
    'src/__tests__/api_5.test.ts',
    'src/__tests__/custom_policies_container.test.ts',
    'src/__tests__/datastore-modelgen.test.ts',
    'src/__tests__/delete.test.ts',
    'src/__tests__/diagnose.test.ts',
    'src/__tests__/env-2.test.ts',
    'src/__tests__/env-3.test.ts',
    'src/__tests__/export.test.ts',
    'src/__tests__/function_1.test.ts',
    'src/__tests__/function_2a.test.ts',
    'src/__tests__/function_2b.test.ts',
    'src/__tests__/function_3a.test.ts',
    'src/__tests__/function_3b.test.ts',
    'src/__tests__/function_4.test.ts',
    'src/__tests__/function_6.test.ts',
    'src/__tests__/function_7.test.ts',
    'src/__tests__/function_8.test.ts',
    'src/__tests__/geo-add-c.test.ts',
    'src/__tests__/geo-add-e.test.ts',
    'src/__tests__/geo-add-f.test.ts',
    'src/__tests__/geo-remove-1.test.ts',
    'src/__tests__/geo-remove-2.test.ts',
    'src/__tests__/geo-remove-3.test.ts',
    'src/__tests__/geo-update-1.test.ts',
    'src/__tests__/geo-update-2.test.ts',
    'src/__tests__/git-clone-attach.test.ts',
    'src/__tests__/hooks-a.test.ts',
    'src/__tests__/import_auth_1a.test.ts',
    'src/__tests__/import_auth_1b.test.ts',
    'src/__tests__/import_auth_2a.test.ts',
    'src/__tests__/import_auth_2b.test.ts',
    'src/__tests__/import_auth_3.test.ts',
    'src/__tests__/import_dynamodb_2a.test.ts',
    'src/__tests__/import_dynamodb_2c.test.ts',
    'src/__tests__/import_s3_1.test.ts',
    'src/__tests__/import_s3_2a.test.ts',
    'src/__tests__/import_s3_2c.test.ts',
    'src/__tests__/layer-2.test.ts',
    'src/__tests__/mock-api.test.ts',
    'src/__tests__/notifications-analytics-compatibility-in-app-1.test.ts',
    'src/__tests__/notifications-analytics-compatibility-sms-1.test.ts',
    'src/__tests__/notifications-analytics-compatibility-sms-2.test.ts',
    'src/__tests__/notifications-in-app-messaging-env-1.test.ts',
    'src/__tests__/notifications-in-app-messaging-env-2.test.ts',
    'src/__tests__/notifications-lifecycle.test.ts',
    'src/__tests__/notifications-sms-pull.test.ts',
    'src/__tests__/notifications-sms.test.ts',
    'src/__tests__/pull.test.ts',
    'src/__tests__/schema-auth-11-a.test.ts',
    'src/__tests__/schema-auth-15.test.ts',
    'src/__tests__/schema-auth-9-a.test.ts',
    'src/__tests__/schema-auth-9-b.test.ts',
    'src/__tests__/schema-auth-9-c.test.ts',
    'src/__tests__/schema-iterative-rollback-1.test.ts',
    'src/__tests__/schema-iterative-rollback-2.test.ts',
    'src/__tests__/storage-2.test.ts',
    'src/__tests__/storage-5.test.ts',
    'src/__tests__/studio-modelgen.test.ts',
    'src/__tests__/transformer-migrations/http-migration.test.ts',
    'src/__tests__/transformer-migrations/model-migration.test.ts',
    'src/__tests__/transformer-migrations/searchable-migration.test.ts',
    'src/__tests__/uibuilder.test.ts',
    'src/__tests__/pinpoint/android-analytics-pinpoint-config.test.ts',
    'src/__tests__/pinpoint/android-notifications-pinpoint-config.test.ts',
    'src/__tests__/pinpoint/flutter-analytics-pinpoint-config.test.ts',
    'src/__tests__/pinpoint/flutter-notifications-pinpoint-config.test.ts',
    'src/__tests__/pinpoint/ios-analytics-pinpoint-config.test.ts',
    'src/__tests__/pinpoint/ios-notifications-pinpoint-config.test.ts',
    'src/__tests__/pinpoint/javascript-analytics-pinpoint-config.test.ts',
    'src/__tests__/pinpoint/javascript-notifications-pinpoint-config.test.ts',
    'src/__tests__/pinpoint/notifications-pinpoint-config-util.ts',
  ],
};
const MAX_WORKERS = 3;
type OS_TYPE = 'w' | 'l';
type CandidateJob = {
  region: string;
  os: OS_TYPE;
  executor: string;
  tests: string[];
  useParentAccount: boolean;
  // intentially leaving this here - accounts are randomly assigned to jobs
  // by a via local_publish_helpers.sh script
  // account: string,
};

const createRandomJob = (os: OS_TYPE): CandidateJob => {
  const region = regions[Math.floor(Math.random() * regions.length)];
  return {
    region,
    os,
    executor: os === 'l' ? 'l_large' : 'w_medium',
    tests: [],
    useParentAccount: false,
  };
};

export const splitTestsV2 = function splitTests(
  config: Readonly<CircleCIConfig>,
  counts: { w: number; l: number },
  baseJobName: string,
  workflowName: string,
  jobRootDir: string,
  isMigration: boolean,
  pickTests: ((testSuites: string[]) => string[]) | undefined,
): CircleCIConfig {
  const output: CircleCIConfig = { ...config };
  const baseJobs = { ...config.jobs };
  const baseJob = baseJobs[baseJobName];

  let testSuites = getTestFiles(jobRootDir);
  if (pickTests && typeof pickTests === 'function') {
    testSuites = pickTests(testSuites);
  }
  if (testSuites.length === 0) {
    return output;
  }
  const testFileRunTimes = loadTestTimings().timingData;

  testSuites.sort((a, b) => {
    const runtimeA = testFileRunTimes.find(t => t.test === a)?.medianRuntime ?? 30;
    const runtimeB = testFileRunTimes.find(t => t.test === b)?.medianRuntime ?? 30;
    return runtimeA - runtimeB;
  });
  const generateJobsForOS = (os: OS_TYPE) => {
    // migration tests are not supported for windows
    if (isMigration && os === 'w') {
      return [];
    }
    const soloJobs = [];
    const osJobs = [createRandomJob(os)];
    for (let test of testSuites) {
      const currentJob = osJobs[osJobs.length - 1];

      // if the current test is excluded from this OS, skip it
      if (TEST_EXCLUSIONS[os].find(excluded => test === excluded)) {
        continue;
      }
      // when we are not running E2E on 'dev', we only run a subset of tests on Windows
      const isNotDevBranch = process.env.CIRCLE_BRANCH !== 'dev';
      if (isNotDevBranch && os === 'w' && !WINDOWS_SMOKE_TESTS.includes(test)) {
        continue; // skip this test
      }
      const US_WEST_2 = FORCE_US_WEST_2.find(t => test.startsWith(t));
      const USE_PARENT = USE_PARENT_ACCOUNT.some(usesParent => test.startsWith(usesParent));

      if (isMigration || RUN_SOLO.find(solo => test === solo)) {
        const newSoloJob = createRandomJob(os);
        newSoloJob.tests.push(test);
        if (US_WEST_2) {
          newSoloJob.region = 'us-west-2';
        }
        if (USE_PARENT) {
          newSoloJob.useParentAccount = true;
        }
        soloJobs.push(newSoloJob);
        continue;
      }

      // add the test
      currentJob.tests.push(test);
      if (US_WEST_2) {
        currentJob.region = 'us-west-2';
      }
      if (USE_PARENT) {
        currentJob.useParentAccount = true;
      }

      // create a new job once the current job is full;
      if (currentJob.tests.length >= MAX_WORKERS) {
        osJobs.push(createRandomJob(os));
      }
    }
    return [...osJobs, ...soloJobs];
  };
  const linuxJobs = generateJobsForOS('l');
  const windowsJobs = generateJobsForOS('w');

  // create the new job configurations, which will be added to the "jobs"
  // section of the CircleCI config file
  let newJobConfigurations = {};
  const generateJobConfigurations = (jobs: CandidateJob[]) => {
    for (let j of jobs) {
      if (j.tests.length === 0) {
        continue;
      }
      const names = j.tests.map(tn => getOldJobNameWithoutSuffixes(tn)).join('_');
      let jobName = `${j.os}_${names}`;
      if (isMigration) {
        const startIndex = baseJobName.lastIndexOf('_');
        jobName = jobName + baseJobName.substring(startIndex);
      }

      newJobConfigurations = {
        ...newJobConfigurations,
        [jobName]: {
          ...baseJob,
          environment: {
            ...(baseJob?.environment || {}),
            TEST_SUITE: j.tests.join('|'),
            CLI_REGION: j.region,
            ...(j.useParentAccount ? { USE_PARENT_ACCOUNT: 1 } : {}),
          },
        },
      };
      if (j.os === 'l') {
        counts.l = counts.l + 1;
      } else {
        counts.w = counts.w + 1;
      }
    }
  };
  generateJobConfigurations(linuxJobs);
  generateJobConfigurations(windowsJobs);

  // Split jobs by region
  const jobByRegion = Object.entries(newJobConfigurations).reduce((acc: Record<string, any>, entry: [string, any]) => {
    const [jobName, job] = entry;
    const region = job?.environment?.CLI_REGION;
    const regionJobs = { ...acc[region], [jobName]: job };
    return { ...acc, [region]: regionJobs };
  }, {});

  const workflows = { ...config.workflows };

  if (workflows[workflowName]) {
    const workflow = workflows[workflowName];

    const workflowJob = workflow.jobs.find(j => {
      if (typeof j === 'string') {
        return j === baseJobName;
      } else {
        const name = Object.keys(j)[0];
        return name === baseJobName;
      }
    });

    if (workflowJob) {
      Object.values(jobByRegion).forEach((regionJobs: any) => {
        const newJobNames = Object.keys(regionJobs as object);
        const jobs = newJobNames.map((newJobName, index) => {
          if (typeof workflowJob === 'string') {
            return newJobName;
          } else {
            const isSingleTest = regionJobs[newJobName].environment.TEST_SUITE.split('|').length === 1;
            let requiredJobs = workflowJob[baseJobName].requires || [];
            // don't need to wait on windows if this is a linux test
            if (newJobName.startsWith('l')) {
              requiredJobs = requiredJobs.filter(j => j !== 'build_windows_workspace_for_e2e');
            }
            // we can downsize on linux
            let runner = isMigration || isSingleTest ? 'l_medium' : 'l_large';
            if (!newJobName.startsWith('l')) {
              runner = 'w_medium'; // w_medium is the smallest we can go for windows
            }
            return {
              [newJobName]: {
                ...Object.values(workflowJob)[0],
                requires: requiredJobs,
                matrix: {
                  parameters: {
                    os: [runner],
                  },
                },
              },
            };
          }
        });
        workflow.jobs = [...workflow.jobs, ...jobs];
      });

      const lastJobBatch = Object.values(jobByRegion)
        .map(regionJobs => getLastBatchJobs(Object.keys(regionJobs as Object), 50))
        .reduce((acc, val) => acc.concat(val), []);
      const filteredJobs = replaceWorkflowDependency(removeWorkflowJob(workflow.jobs, baseJobName), baseJobName, lastJobBatch);
      workflow.jobs = filteredJobs;
    }
    output.workflows = workflows;
  }
  output.jobs = {
    ...output.jobs,
    ...newJobConfigurations,
  };
  return output;
};

/**
 * CircleCI workflow can have multiple jobs. This helper function removes the jobName from the workflow
 * @param jobs - All the jobs in workflow
 * @param jobName - job that needs to be removed from workflow
 */
export function removeWorkflowJob(jobs: WorkflowJob[], jobName: string): WorkflowJob[] {
  return jobs.filter(j => {
    if (typeof j === 'string') {
      return j !== jobName;
    } else {
      const name = Object.keys(j)[0];
      return name !== jobName;
    }
  });
}

/**
 *
 * @param jobs array of job names
 * @param concurrency number of concurrent jobs
 */
export function getLastBatchJobs(jobs: string[], concurrency: number): string[] {
  const lastBatchJobLength = Math.min(concurrency, jobs.length);
  const lastBatchJobNames = jobs.slice(jobs.length - lastBatchJobLength);
  return lastBatchJobNames;
}

/**
 * A job in workflow can require some other job in the workflow to be finished before executing
 * This helper method finds and replaces jobName with jobsToReplacesWith
 * @param jobs - Workflow jobs
 * @param jobName - job to remove from requires
 * @param jobsToReplaceWith - jobs to add to requires
 */
export function replaceWorkflowDependency(jobs: WorkflowJob[], jobName: string, jobsToReplaceWith: string[]): WorkflowJob[] {
  return jobs.map(j => {
    if (typeof j === 'string') return j;
    const [currentJobName, jobObj] = Object.entries(j)[0];
    const requires = jobObj.requires || [];
    if (requires.includes(jobName)) {
      jobObj.requires = [...requires.filter(r => r !== jobName), ...jobsToReplaceWith];
    }
    return {
      [currentJobName]: jobObj,
    };
  });
}
