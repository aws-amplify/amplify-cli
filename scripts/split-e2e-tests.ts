import * as yaml from 'js-yaml';
import * as glob from 'glob';
import { join } from 'path';
import * as fs from 'fs-extra';
import * as execa from 'execa';

const CONCURRENCY = 25;
// Some our e2e tests are known to fail when run on windows hosts
// These are caused by issues with our test harness, not broken cli behavior on windows
// (examples: sending line endings when we shouldn't, java/gradle not installed on windows host)
// Each of these failures should be independently investigated, resolved, and removed from this list.
// For now, this list is being used to skip creation of circleci jobs for these tasks
const WINDOWS_TEST_ALLOWLIST = [
  'configure-project_pkg-w',
  'container-hosting_pkg-w',
  'containers-api_pkg-w',
  'custom_policies_container_pkg-w',
  'custom_policies_function_pkg-w',
  'delete_pkg-w',
  'feature-flags_pkg-w',
  'frontend_config_drift_pkg-w',
  'function_1_pkg-w',
  'function_2_pkg-w',
  'function_5_pkg-w',
  'geo-add_pkg-w',
  'geo-remove_pkg-w',
  'geo-update_pkg-w',
  'hooks_pkg-w',
  'hostingPROD_pkg-w',
  'hosting_pkg-w',
  'iam-permissions-boundary_pkg-w',
  'import_dynamodb_1_pkg-w',
  'import_s3_1_pkg-w',
  'import_s3_3_pkg-w',
  'init-special-case_pkg-w',
  'init_pkg-w',
  'interactions_pkg-w',
  'model-migration_pkg-w',
  'node-function_pkg-w',
  'notifications_pkg-w',
  'plugin_pkg-w',
  'predictions-migration_pkg-w',
  'predictions_pkg-w',
  'pull_pkg-w',
  's3-sse_pkg-w',
  'schema-auth-10_pkg-w',
  'schema-auth-11_pkg-w',
  'schema-auth-12_pkg-w',
  'schema-auth-13_pkg-w',
  'schema-auth-1_pkg-w',
  'schema-auth-2_pkg-w',
  'schema-auth-3_pkg-w',
  'schema-auth-4_pkg-w',
  'schema-auth-5_pkg-w',
  'schema-auth-6_pkg-w',
  'schema-auth-7_pkg-w',
  'schema-auth-8_pkg-w',
  'schema-auth-9_pkg-w',
  'schema-connection_pkg-w',
  'schema-data-access-patterns_pkg-w',
  'schema-function-1_pkg-w',
  'schema-function-2_pkg-w',
  'schema-iterative-update-1_pkg-w',
  'schema-iterative-update-2_pkg-w',
  'schema-iterative-update-3_pkg-w',
  'schema-iterative-update-4_pkg-w',
  'schema-iterative-update-locking_pkg-w',
  'schema-key_pkg-w',
  'schema-model_pkg-w',
  'schema-predictions_pkg-w',
  'schema-searchable_pkg-w',
  'schema-versioned_pkg-w',
  'storage-1_pkg-w',
  'storage-2_pkg-w',
  'storage-3_pkg-w',
  'storage-4_pkg-w',
  'tags_pkg-w',
];

// Ensure to update packages/amplify-e2e-tests/src/cleanup-e2e-resources.ts is also updated this gets updated
const AWS_REGIONS_TO_RUN_TESTS = [
  'us-east-2',
  'us-west-2',
  'eu-west-2',
  'eu-central-1',
  'ap-northeast-1',
  'ap-southeast-1',
  'ap-southeast-2',
];

// Some services (eg. amazon lex) are not available in all regions
// Tests added to this list will always run in us-west-2
const FORCE_US_WEST_2 = ['interactions'];

const USE_PARENT_ACCOUNT = [
  'api_2',
  'api_1',
  'auth_2',
  'import_dynamodb_1',
  'import_s3_1',
  'api-key-migration2',
  'api-key-migration3',
  'api-key-migration4',
  'api-key-migration5',
  'storage',
];

// This array needs to be update periodically when new tests suites get added
// or when a test suite changes drastically

const KNOWN_SUITES_SORTED_ACCORDING_TO_RUNTIME = [
  //<10m
  'src/__tests__/plugin.test.ts',
  'src/__tests__/init-special-case.test.ts',
  'src/__tests__/datastore-modelgen.test.ts',
  'src/__tests__/amplify-configure.test.ts',
  'src/__tests__/init.test.ts',
  'src/__tests__/tags.test.ts',
  'src/__tests__/notifications.test.ts',
  'src/__tests__/geo-headless.test.ts',
  //<15m
  'src/__tests__/schema-versioned.test.ts',
  'src/__tests__/schema-data-access-patterns.test.ts',
  'src/__tests__/interactions.test.ts',
  'src/__tests__/schema-predictions.test.ts',
  'src/__tests__/amplify-app.test.ts',
  'src/__tests__/hosting.test.ts',
  'src/__tests__/analytics.test.ts',
  'src/__tests__/feature-flags.test.ts',
  'src/__tests__/schema-iterative-update-2.test.ts',
  'src/__tests__/containers-api.test.ts',
  //<20m
  'src/__tests__/predictions.test.ts',
  'src/__tests__/hostingPROD.test.ts',
  'src/__tests__/geo-add.test.ts',
  'src/__tests__/geo-update.test.ts',
  'src/__tests__/geo-remove.test.ts',
  //<25m
  'src/__tests__/schema-auth-10.test.ts',
  'src/__tests__/schema-key.test.ts',
  'src/__tests__/auth_1.test.ts',
  'src/__tests__/auth_5.test.ts',
  'src/__tests__/function_3.test.ts',
  'src/__tests__/schema-iterative-update-1.test.ts',
  //<30m
  'src/__tests__/schema-auth-3.test.ts',
  'src/__tests__/delete.test.ts',
  'src/__tests__/function_2.test.ts',
  'src/__tests__/auth_3.test.ts',
  'src/__tests__/layer.test.ts',
  //<35m
  'src/__tests__/migration/api.key.migration1.test.ts',
  'src/__tests__/auth_4.test.ts',
  'src/__tests__/schema-auth-7.test.ts',
  'src/__tests__/schema-auth-8.test.ts',
  'src/__tests__/schema-searchable.test.ts',
  'src/__tests__/schema-auth-4.test.ts',
  'src/__tests__/api_3.test.ts',
  'src/__tests__/import_auth_1.test.ts',
  'src/__tests__/import_auth_2.test.ts',
  'src/__tests__/import_s3_1.test.ts',
  'src/__tests__/import_dynamodb_1.test.ts',
  'src/__tests__/schema-iterative-rollback-1.test.ts',
  //<40m
  'src/__tests__/schema-iterative-rollback-2.test.ts',
  'src/__tests__/env.test.ts',
  'src/__tests__/auth_2.test.ts',
  'src/__tests__/schema-auth-9.test.ts',
  'src/__tests__/schema-auth-11.test.ts',
  'src/__tests__/migration/api.key.migration2.test.ts',
  'src/__tests__/migration/api.key.migration3.test.ts',
  'src/__tests__/function_1.test.ts',
  'src/__tests__/schema-auth-1.test.ts',
  'src/__tests__/function_4.test.ts',
  //<45m
  'src/__tests__/schema-function.test.ts',
  'src/__tests__/schema-model.test.ts',
  'src/__tests__/migration/api.connection.migration.test.ts',
  'src/__tests__/schema-connection.test.ts',
  'src/__tests__/schema-auth-6.test.ts',
  'src/__tests__/schema-iterative-update-3.test.ts',
  //<50m
  'src/__tests__/schema-auth-2.test.ts',
  'src/__tests__/api_1.test.ts',
  'src/__tests__/schema-auth-5.test.ts',
  //<55m
  'src/__tests__/storage.test.ts',
  'src/__tests__/api_2.test.ts',
  'src/__tests__/api_5.test.ts',
  'src/__tests__/api_6.test.ts',
  'src/__tests__/schema-iterative-update-4.test.ts',
];

/**
 * Sorts the test suite in ascending order. If the test is not included in known
 * tests it would be inserted at the begining o the array
 * @param tesSuites an array of test suites
 */
function sortTestsBasedOnTime(tesSuites: string[]): string[] {
  return tesSuites.sort((a, b) => {
    const aIndx = KNOWN_SUITES_SORTED_ACCORDING_TO_RUNTIME.indexOf(a);
    const bIndx = KNOWN_SUITES_SORTED_ACCORDING_TO_RUNTIME.indexOf(b);
    return aIndx - bIndx;
  });
}

export type WorkflowJob =
  | {
      [name: string]: {
        requires?: string[];
      };
    }
  | string;

export type CircleCIConfig = {
  jobs: {
    [name: string]: {
      steps: Record<string, any>;
      environment: Record<string, string>;
    };
  };
  workflows: {
    [workflowName: string]: {
      jobs: WorkflowJob[];
    };
  };
};

const repoRoot = join(__dirname, '..');

function getTestFiles(dir: string, pattern = 'src/**/*.test.ts'): string[] {
  // Todo: add reverse to run longest tests first
  return sortTestsBasedOnTime(glob.sync(pattern, { cwd: dir })); // .reverse();
}

function generateJobName(baseName: string, testSuitePath: string): string {
  const startIndex = testSuitePath.lastIndexOf('/') + 1;
  const endIndex = testSuitePath.lastIndexOf('.test');
  let name = testSuitePath.substring(startIndex, endIndex).split('.e2e').join('').split('.').join('-');
  if (baseName.includes('pkg')) {
    name = name + '_pkg';
  }
  if (baseName.includes('amplify_migration_tests')) {
    const startIndex = baseName.lastIndexOf('_');
    name = name + baseName.substring(startIndex);
  }
  return name;
}

/**
 * Takes a CircleCI config and converts each test inside that job into a separate
 * job.
 * @param config - CircleCI config
 * @param jobName - job that should be split
 * @param workflowName - workflow name where this job is run
 * @param jobRootDir - Directory to scan for test files
 * @param concurrency - Number of parallel jobs to run
 */
function splitTests(
  config: Readonly<CircleCIConfig>,
  jobName: string,
  workflowName: string,
  jobRootDir: string,
  concurrency: number = CONCURRENCY,
  isMigration: boolean = false,
): CircleCIConfig {
  const output: CircleCIConfig = { ...config };
  const jobs = { ...config.jobs };
  const job = jobs[jobName];
  const testSuites = getTestFiles(jobRootDir);

  const newJobs = testSuites.reduce((acc, suite, index) => {
    const newJobName = generateJobName(jobName, suite);
    const testRegion = FORCE_US_WEST_2.some(job => newJobName.startsWith(job))
      ? 'us-west-2'
      : AWS_REGIONS_TO_RUN_TESTS[index % AWS_REGIONS_TO_RUN_TESTS.length];
    const newJob = {
      ...job,
      environment: {
        ...(job?.environment || {}),
        TEST_SUITE: suite,
        CLI_REGION: testRegion,
        ...(USE_PARENT_ACCOUNT.some(job => newJobName.startsWith(job)) ? { USE_PARENT_ACCOUNT: 1 } : {}),
      },
    };
    const isPkg = newJobName.endsWith('_pkg');
    if (!isPkg) {
      (newJob.environment as any) = {
        ...newJob.environment,
        ...(isMigration
          ? {
              AMPLIFY_PATH: '/home/circleci/.npm-global/lib/node_modules/@aws-amplify/cli/bin/amplify',
            }
          : {
              AMPLIFY_DIR: '/home/circleci/repo/packages/amplify-cli/bin',
              AMPLIFY_PATH: '/home/circleci/repo/packages/amplify-cli/bin/amplify',
            }),
      };
    }
    return { ...acc, [newJobName]: newJob };
  }, {});

  // Spilt jobs by region
  const jobByRegion = Object.entries(newJobs).reduce((acc, entry: [string, any]) => {
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
        return j === jobName;
      } else {
        const name = Object.keys(j)[0];
        return name === jobName;
      }
    });

    if (workflowJob) {
      Object.values(jobByRegion).forEach(regionJobs => {
        const newJobNames = Object.keys(regionJobs);
        const jobs = newJobNames.map((newJobName, index) => {
          const requires = getRequiredJob(newJobNames, index, concurrency);
          if (typeof workflowJob === 'string') {
            return newJobName;
          } else {
            return {
              [newJobName]: {
                ...Object.values(workflowJob)[0],
                requires: [...(requires ? [requires] : workflowJob[jobName].requires || [])],
                matrix: {
                  parameters: {
                    os: WINDOWS_TEST_ALLOWLIST.includes(newJobName) ? ['w', 'l'] : ['l'],
                  },
                },
              },
            };
          }
        });
        workflow.jobs = [...workflow.jobs, ...jobs];
      });

      const lastJobBatch = Object.values(jobByRegion)
        .map(regionJobs => getLastBatchJobs(Object.keys(regionJobs), concurrency))
        .reduce((acc, val) => acc.concat(val), []);
      const filteredJobs = replaceWorkflowDependency(removeWorkflowJob(workflow.jobs, jobName), jobName, lastJobBatch);
      workflow.jobs = filteredJobs;
    }
    output.workflows = workflows;
  }
  output.jobs = {
    ...output.jobs,
    ...newJobs,
  };
  return output;
}

/**
 * CircleCI workflow can have multiple jobs. This helper function removes the jobName from the workflow
 * @param jobs - All the jobs in workflow
 * @param jobName - job that needs to be removed from workflow
 */
function removeWorkflowJob(jobs: WorkflowJob[], jobName: string): WorkflowJob[] {
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
function getLastBatchJobs(jobs: string[], concurrency: number): string[] {
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
function replaceWorkflowDependency(jobs: WorkflowJob[], jobName: string, jobsToReplaceWith: string[]): WorkflowJob[] {
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

/**
 * Helper function that creates requires block for jobs to limit the concurrency of jobs in circle ci
 * @param jobNames - An array of jobs
 * @param index - current index of the job
 * @param concurrency - number of parallel jobs allowed
 */
function getRequiredJob(jobNames: string[], index: number, concurrency: number = 4): string | void {
  const mod = index % concurrency;
  const mult = Math.floor(index / concurrency);
  if (mult > 0) {
    const prevIndex = (mult - 1) * concurrency + mod;
    return jobNames[prevIndex];
  }
}

function loadConfig(): CircleCIConfig {
  const configFile = join(repoRoot, '.circleci', 'config.base.yml');
  return <CircleCIConfig>yaml.load(fs.readFileSync(configFile, 'utf8'));
}

function saveConfig(config: CircleCIConfig): void {
  const configFile = join(repoRoot, '.circleci', 'generated_config.yml');
  const output = ['# auto generated file. Edit config.base.yaml if you want to change', yaml.dump(config, { noRefs: true })];
  fs.writeFileSync(configFile, output.join('\n'));
}

function verifyConfig() {
  if (process.env.CIRCLECI) {
    console.log('Skipping config verification since this is already running in a CCI environment.');
    return;
  }
  try {
    execa.commandSync('which circleci');
  } catch {
    console.error(
      'Please install circleci cli to validate your circle config. Installation information can be found at https://circleci.com/docs/2.0/local-cli/',
    );
    process.exit(1);
  }
  const cci_config_path = join(repoRoot, '.circleci', 'config.yml');
  const cci_generated_config_path = join(repoRoot, '.circleci', 'generated_config.yml');
  try {
    execa.commandSync(`circleci config validate ${cci_config_path}`);
  } catch {
    console.error(`"circleci config validate" command failed. Please check your .circleci/config.yml validity`);
    process.exit(1);
  }
  try {
    execa.commandSync(`circleci config validate ${cci_generated_config_path}`);
  } catch (e) {
    console.log(e);
    console.error(`"circleci config validate" command failed. Please check your .circleci/generated_config.yml validity`);
    process.exit(1);
  }
}

function main(): void {
  const config = loadConfig();
  const splitNodeTests = splitTests(
    config,
    'amplify_e2e_tests',
    'build_test_deploy',
    join(repoRoot, 'packages', 'amplify-e2e-tests'),
    CONCURRENCY,
  );
  const splitPkgTests = splitTests(
    splitNodeTests,
    'amplify_e2e_tests_pkg',
    'build_test_deploy',
    join(repoRoot, 'packages', 'amplify-e2e-tests'),
    CONCURRENCY,
  );
  const splitGqlTests = splitTests(
    splitPkgTests,
    'graphql_e2e_tests',
    'build_test_deploy',
    join(repoRoot, 'packages', 'graphql-transformers-e2e-tests'),
    CONCURRENCY,
  );
  const splitV5MigrationTests = splitTests(
    splitGqlTests,
    'amplify_migration_tests_v5',
    'build_test_deploy',
    join(repoRoot, 'packages', 'amplify-migration-tests'),
    CONCURRENCY,
    true,
  );
  const splitV6MigrationTests = splitTests(
    splitV5MigrationTests,
    'amplify_migration_tests_v6',
    'build_test_deploy',
    join(repoRoot, 'packages', 'amplify-migration-tests'),
    CONCURRENCY,
    true,
  );
  saveConfig(splitV6MigrationTests);
  verifyConfig();
}
main();
