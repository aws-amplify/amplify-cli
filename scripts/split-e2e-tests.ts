import * as execa from 'execa';
import * as fs from 'fs-extra';
import * as glob from 'glob';
import * as yaml from 'js-yaml';
import { join } from 'path';
import { ARTIFACT_STORAGE_PATH_ALLOW_LIST } from './artifact-storage-path-allow-list';
import { migrationFromV10Tests, migrationFromV5Tests, migrationFromV6Tests } from './split-e2e-test-filters';

const CONCURRENCY = 35;
// Some our e2e tests are known to fail when run on windows hosts
// These are caused by issues with our test harness, not broken cli behavior on windows
// (examples: sending line endings when we shouldn't, java/gradle not installed on windows host)
// Each of these failures should be independently investigated, resolved, and removed from this list.
// For now, this list is being used to skip creation of circleci jobs for these tasks

// Todo: update the split test strategy to use parallelization so circleci results dont go over the limits of github payload size
const WINDOWS_TEST_SKIP_LIST: string[] = [
  'amplify-app_pkg',
  'analytics-2_pkg',
  'api_migration_update_v5',
  'api_migration_update_v6',
  'api-key-migration_v5',
  'api-key-migration_v6',
  'api-key-migration-2_v5',
  'api-key-migration-2_v6',
  'api-migration-a_v5',
  'api-migration-a_v6',
  'api-migration-b_v5',
  'api-migration-b_v6',
  'api-migration-c_v5',
  'api-migration-c_v6',
  'api-migration-d_v5',
  'api-migration-d_v6',
  'apigw-ext-migration_v5',
  'apigw-ext-migration_v6',
  'auth_migration_update_v5',
  'auth_migration_update_v6',
  'auth-migration-a_v5',
  'auth-migration-a_v6',
  'auth-migration-b_v5',
  'auth-migration-b_v6',
  'auth-migration-c_v5',
  'auth-migration-c_v6',
  'auth-migration-d_v5',
  'auth-migration-d_v6',
  'auth-migration-e_v5',
  'auth-migration-e_v6',
  'datastore-modelgen_pkg',
  'delete_pkg',
  'diagnose_pkg',
  'dotnet_runtime_update_migration_v10',
  'env-2_pkg',
  'export_pkg',
  'function_3a_pkg',
  'function_3b_pkg',
  'function_4_pkg',
  'function_6_pkg',
  'function_7_pkg',
  'function_8_pkg',
  'function_migration_update_v5',
  'function_migration_update_v6',
  'geo-add-e_pkg',
  'geo-add-f_pkg',
  'geo-remove-2_pkg',
  'geo-remove-3_pkg',
  'geo-update-1_pkg',
  'geo-update-2_pkg',
  'git-clone-attach_pkg',
  'hooks-a_pkg',
  'import_auth_1a_pkg',
  'import_auth_1b_pkg',
  'import_auth_2a_pkg',
  'import_auth_2b_pkg',
  'import_auth_3_pkg',
  'import_dynamodb_2a_pkg',
  'import_dynamodb_2c_pkg',
  'import_s3_2a_pkg',
  'import_s3_2c_pkg',
  'init-migration_v5',
  'init-migration_v6',
  'layer-2_pkg',
  'layer-migration_v5',
  'layer-migration_v6',
  'mock-api_pkg',
  'model-migration_pkg',
  'notifications-analytics-compatibility-in-app-1_pkg',
  'notifications-analytics-compatibility-sms-1_pkg',
  'notifications-analytics-compatibility-sms-2_pkg',
  'notifications-in-app-messaging-env-1_pkg',
  'notifications-in-app-messaging-env-2_pkg',
  'notifications-lifecycle_pkg',
  'notifications-migration_v5',
  'notifications-migration_v6',
  'notifications-migration-2_v5',
  'notifications-migration-2_v6',
  'notifications-migration-3_v5',
  'notifications-migration-3_v6',
  'notifications-migration-4_v5',
  'notifications-migration-4_v6',
  'notifications-sms_pkg',
  'notifications-sms-pull_pkg',
  'pull_pkg',
  'scaffold_v10',
  'schema-iterative-rollback-1_pkg',
  'schema-iterative-rollback-2_pkg',
  'storage_migration_update_v5',
  'storage_migration_update_v6',
  'studio-modelgen_pkg',
  'uibuilder_pkg',
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
  'import_dynamodb_1',
  'import_s3_1',
  'searchable-migration',
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
  pickTests: ((testSuites: string[]) => string[]) | undefined,
): CircleCIConfig {
  const output: CircleCIConfig = { ...config };
  const jobs = { ...config.jobs };
  const job = jobs[jobName];
  let testSuites = getTestFiles(jobRootDir);
  if(pickTests && typeof pickTests === 'function'){
    testSuites = pickTests(testSuites);
  }

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
    return { ...acc, [newJobName]: newJob };
  }, {});

  // Spilt jobs by region
  const jobByRegion = Object.entries(newJobs).reduce((acc: Record<string, any>, entry: [string, any]) => {
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
            const linuxVMSize = JOBS_RUNNING_ON_LINUX_LARGE_VM.includes(newJobName) ? 'l_large' : 'l_medium';
            const windowsVMSize = 'w_medium';
            let requiredJobs = workflowJob[jobName].requires || [];
            const skipWindows = WINDOWS_TEST_SKIP_LIST.includes(newJobName);
            if (skipWindows) {
              requiredJobs = requiredJobs.filter(j => j !== 'build_windows_workspace_for_e2e');
            }
            return {
              [newJobName]: {
                ...Object.values(workflowJob)[0],
                requires: requiredJobs,
                matrix: {
                  parameters: {
                    os: skipWindows ? [linuxVMSize] : [linuxVMSize, windowsVMSize],
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
    undefined
  );
  const splitGqlTests = splitTests(
    splitPkgTests,
    'graphql_e2e_tests',
    'build_test_deploy_v3',
    join(repoRoot, 'packages', 'graphql-transformers-e2e-tests'),
    CONCURRENCY,
    undefined
  );
  const splitV5MigrationTests = splitTests(
    splitGqlTests,
    'amplify_migration_tests_v5',
    'build_test_deploy_v3',
    join(repoRoot, 'packages', 'amplify-migration-tests'),
    CONCURRENCY,
    (tests: string[]) => {
      return tests.filter(testName => migrationFromV5Tests.find((t) => t === testName));
    }
  );
  const splitV6MigrationTests = splitTests(
    splitV5MigrationTests,
    'amplify_migration_tests_v6',
    'build_test_deploy_v3',
    join(repoRoot, 'packages', 'amplify-migration-tests'),
    CONCURRENCY,
    (tests: string[]) => {
      return tests.filter(testName => migrationFromV6Tests.find((t) => t === testName));
    }
  );
  const splitV10MigrationTests = splitTests(
    splitV6MigrationTests,
    'amplify_migration_tests_v10',
    'build_test_deploy_v3',
    join(repoRoot, 'packages', 'amplify-migration-tests'),
    CONCURRENCY,
    (tests: string[]) => {
      return tests.filter(testName => migrationFromV10Tests.find((t) => t === testName));
    }
  );
  saveConfig(splitV10MigrationTests);
  verifyConfig();
}
main();
