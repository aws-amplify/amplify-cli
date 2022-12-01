import * as yaml from 'js-yaml';
import * as glob from 'glob';
import { join } from 'path';
import * as fs from 'fs-extra';
import * as execa from 'execa';
import { ARTIFACT_STORAGE_PATH_ALLOW_LIST } from './artifact-storage-path-allow-list';

const CONCURRENCY = 35;
// Some our e2e tests are known to fail when run on windows hosts
// These are caused by issues with our test harness, not broken cli behavior on windows
// (examples: sending line endings when we shouldn't, java/gradle not installed on windows host)
// Each of these failures should be independently investigated, resolved, and removed from this list.
// For now, this list is being used to skip creation of circleci jobs for these tasks

// Todo: update the split test strategy to use parallelization so circleci results dont go over the limits of github payload size
const WINDOWS_TEST_ALLOWLIST: string[] = [
  'schema-function-1_pkg',
  'tags_pkg',
  'schema-auth-9-a_pkg',
  'schema-auth-9-b_pkg',
  'schema-auth-9-c_pkg',
  'schema-model-a_pkg',
  'schema-model-b_pkg',
  'schema-model-c_pkg',
  'schema-model-d_pkg',
  'schema-model-e_pkg',
  'api_lambda_auth_pkg',
  'node-function_pkg',
  'schema-function-2_pkg',
  'notifications_pkg',
  'interactions_pkg',
  'analytics_pkg',
  'schema-auth-7a_pkg',
  'schema-auth-7b_pkg',
  'schema-auth-7c_pkg',
  'schema-auth-11-a_pkg',
  'schema-auth-11-b_pkg',
  'schema-auth-11-c_pkg',
  'auth_6_pkg',
  'frontend_config_drift_pkg',
  'hooks-b_pkg',
  'plugin_pkg',
  'schema-versioned_pkg',
  'schema-auth-3_pkg',
  'schema-auth-8a_pkg',
  'schema-auth-8b_pkg',
  'schema-auth-8c_pkg',
  'import_dynamodb_1_pkg',
  'schema-connection_pkg',
  'auth_7a_pkg',
  'auth_7b_pkg',
  'iam-permissions-boundary_pkg',
  'schema-data-access-patterns_pkg',
  'schema-auth-10_pkg',
  'schema-searchable_pkg',
  'schema-auth-6_pkg',
  'auth_8a_pkg',
  'auth_8b_pkg',
  'auth_8c_pkg',
  's3-sse_pkg',
  'storage-2_pkg',
  'schema-auth-4a_pkg',
  'schema-auth-4b_pkg',
  'schema-auth-4c_pkg',
  'schema-auth-4d_pkg',
  'configure-project_pkg',
  'schema-auth-12_pkg',
  'storage-3_pkg',
  'amplify-configure_pkg',
  'schema-predictions_pkg',
  'predictions_pkg',
  'auth_1a_pkg',
  'auth_1b_pkg',
  'auth_1c_pkg',
  'schema-auth-1a_pkg',
  'schema-auth-1b_pkg',
  'schema-auth-2a_pkg',
  'schema-auth-2b_pkg',
  'container-hosting_pkg',
  'schema-auth-13_pkg',
  'init_a_pkg',
  'init_b_pkg',
  'init_c_pkg',
  'init_d_pkg',
  'init_e_pkg',
  'init_f_pkg',
  'auth_5a_pkg',
  'auth_5b_pkg',
  'auth_5c_pkg',
  'auth_5d_pkg',
  'auth_5e_pkg',
  'auth_5f_pkg',
];

// some tests may require a larger executor, specify those here
const JOBS_RUNNING_ON_LINUX_LARGE_VM: string[] = [
  'api-migration-a_v6',
  'auth_migration_update_v6',
  'function-migration_pkg',
  'geo-add-f_pkg',
  'import_s3_2a_pkg',
  'model-migration_pkg',
  'notifications-migration-2_v5',
  'schema-auth-14_pkg',
  'schema-auth-15_pkg',
  'schema-searchable_pkg',
];

// Ensure to update packages/amplify-e2e-tests/src/cleanup-e2e-resources.ts is also updated this gets updated
const AWS_REGIONS_TO_RUN_TESTS = [
  'us-east-1',
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
  'searchable-migration',
  'storage',
];

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
      parallelism: number;
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
  return glob.sync(pattern, { cwd: dir });
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
        const newJobNames = Object.keys(regionJobs as object);
        const jobs = newJobNames.map((newJobName, index) => {
          if (typeof workflowJob === 'string') {
            return newJobName;
          } else {
            // for the most up-to-date list of executors for e2e, see the config.base.yml file
            let linuxVMSize = JOBS_RUNNING_ON_LINUX_LARGE_VM.includes(newJobName) ? 'l_large' : 'l_medium';
            return {
              [newJobName]: {
                ...Object.values(workflowJob)[0],
                requires: workflowJob[jobName].requires || [],
                matrix: {
                  parameters: {
                    os: WINDOWS_TEST_ALLOWLIST.includes(newJobName) ? [linuxVMSize, 'w_medium'] : [linuxVMSize],
                  },
                },
              },
            };
          }
        });
        workflow.jobs = [...workflow.jobs, ...jobs];
      });

      const lastJobBatch = Object.values(jobByRegion)
        .map(regionJobs => getLastBatchJobs(Object.keys(regionJobs as Object), concurrency))
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

function validateArtifactStoragePaths(config: CircleCIConfig) {
  // make sure that only valid paths are used to store artifacts/results
  const storagePathsUsedInConfig = new Set();
  const unregisteredPaths = new Set();
  const invalidPaths = new Set();
  for(let key of Object.keys(config.jobs)) {
    const job = config.jobs[key];
    const steps = job.steps;
    
    for(let i = 0; i < steps.length; i ++){
      const resultsPath = steps[i].store_test_results;
      const artifactsPath = steps[i].store_artifacts;
      if(resultsPath){
        storagePathsUsedInConfig.add(resultsPath.path);
        if(ARTIFACT_STORAGE_PATH_ALLOW_LIST.indexOf(resultsPath.path) === -1){
          unregisteredPaths.add(resultsPath.path);
        }
        if (!resultsPath.path.startsWith("~/")){
          invalidPaths.add(resultsPath.path);
        }
      }
      if(artifactsPath){
        storagePathsUsedInConfig.add(artifactsPath.path);
        if(ARTIFACT_STORAGE_PATH_ALLOW_LIST.indexOf(artifactsPath.path) === -1){
          unregisteredPaths.add(artifactsPath.path);
        }
        if (!artifactsPath.path.startsWith("~/")){
          invalidPaths.add(artifactsPath.path);
        }
      }
    }
  }
  if(unregisteredPaths.size > 0 || invalidPaths.size > 0){
    console.log("There are errors in your configuration.\n");

    if(invalidPaths.size > 0){
      const errors = Array.from(invalidPaths);
      console.log("Fix these paths. They must start with ~/",errors, "\n");
    }
    if(unregisteredPaths.size > 0){
      const newList = Array.from(storagePathsUsedInConfig);
      const unregisteredList = Array.from(unregisteredPaths);
      console.log("You are storing artifacts in an unregistered location.");
      console.log("Please update artifact-storage-path-allow-list.ts to include the new storage paths.");
      console.log("Update the list to match this:", newList);
      console.log("Doing so will register these unregistered paths:", unregisteredList);
    }
    process.exit(1);
  }
}

function main(): void {
  const config = loadConfig();
  
  validateArtifactStoragePaths(config);

  const splitPkgTests = splitTests(
    config,
    'amplify_e2e_tests_pkg',
    'build_test_deploy_v3',
    join(repoRoot, 'packages', 'amplify-e2e-tests'),
    CONCURRENCY,
  );
  const splitGqlTests = splitTests(
    splitPkgTests,
    'graphql_e2e_tests',
    'build_test_deploy_v3',
    join(repoRoot, 'packages', 'graphql-transformers-e2e-tests'),
    CONCURRENCY,
  );
  const splitV5MigrationTests = splitTests(
    splitGqlTests,
    'amplify_migration_tests_v5',
    'build_test_deploy_v3',
    join(repoRoot, 'packages', 'amplify-migration-tests'),
    CONCURRENCY,
    true,
  );
  const splitV6MigrationTests = splitTests(
    splitV5MigrationTests,
    'amplify_migration_tests_v6',
    'build_test_deploy_v3',
    join(repoRoot, 'packages', 'amplify-migration-tests'),
    CONCURRENCY,
    true,
  );
  saveConfig(splitV6MigrationTests);
  verifyConfig();
}
main();
