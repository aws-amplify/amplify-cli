import * as glob from 'glob';
import * as fs from 'fs-extra';
import { join } from 'path';
import * as yaml from 'js-yaml';
import { CircleCIConfig } from './cci-types';
import { CircleCIAPIClient, CircleCIClientDefaults } from './cci.api';

export const ClientDefaults: CircleCIClientDefaults = {
  defaultBranch: 'dev',
  defaultWorkflow: 'build_test_deploy_v3',
  vcs: 'github',
  projectSlug: 'aws-amplify',
  projectName: 'amplify-cli',
};
export const getCCIClient = () => {
  if (!process.env.CIRCLECI_TOKEN) {
    throw new Error('CIRCLECI_TOKEN is not set. Export it to your terminal, then try again.');
  }
  return new CircleCIAPIClient(process.env.CIRCLECI_TOKEN, ClientDefaults);
};

// Ensure to update packages/amplify-e2e-tests/src/cleanup-e2e-resources.ts is also updated this gets updated
export const AWS_REGIONS_TO_RUN_TESTS = [
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
// Tests added to this list will always run in a specific region
export const FORCE_REGION_MAP: Map<string, string> = new Map();
FORCE_REGION_MAP.set('src/__tests__/custom-resource-with-storage.test.ts', 'us-west-2');
FORCE_REGION_MAP.set('src/__tests__/interactions.test.ts', 'us-west-2');
FORCE_REGION_MAP.set('src/__tests__/interactions-1.test.ts', 'us-west-2');
FORCE_REGION_MAP.set('src/__tests__/interactions-2.test.ts', 'us-west-2');
FORCE_REGION_MAP.set('src/__tests__/migration_tests_v10/pinpoint-region.migration.test.ts', 'us-east-2');

// some tests require additional time, the parent account can handle longer tests (up to 90 minutes)
export const USE_PARENT_ACCOUNT = [
  'src/__tests__/import_dynamodb_1.test.ts',
  'src/__tests__/import_s3_1.test.ts',
  'src/__tests__/transformer-migrations/searchable-migration.test.ts',
];

export const REPO_ROOT = join(__dirname, '..');
const CIRCLECI_BASE_CONFIG_PATH = join(REPO_ROOT, '.circleci', 'config.base.yml');
const CIRCLECI_GENERATED_CONFIG_PATH = join(REPO_ROOT, '.circleci', 'generated_config.yml');
const TEST_METRICS_PATH = join(REPO_ROOT, 'scripts', 'cci-test.data.json');
const JOB_METRICS_PATH = join(REPO_ROOT, 'scripts', 'cci-job.data.json');
const TEST_TIMINGS_PATH = join(REPO_ROOT, 'scripts', 'cci-test-timings.data.json');
const WORKFLOW_RESULTS_PATH = join(REPO_ROOT, 'artifacts', 'cci-workflow-results.json');
const WORKFLOW_RESULTS_HTML_PATH = join(REPO_ROOT, 'artifacts', 'cci-workflow-results.html');

export function getTestFiles(dir: string, pattern = 'src/**/*.test.ts'): string[] {
  return glob.sync(pattern, { cwd: dir });
}

/**
 * CircleCI test data is different from job data; each job may have multiple test files,
 * and each test file may contain multiple tests.
 * CircleCI reports this data at the testfile + testname specificity.
 *
 * The data in this file is at the TEST level.
 */
export function loadTestMetrics(): any {
  return JSON.parse(fs.readFileSync(TEST_METRICS_PATH, 'utf-8'));
}
export function saveTestMetrics(data: any): any {
  console.log(`saving test metrics to ${TEST_METRICS_PATH}`);
  fs.writeFileSync(TEST_METRICS_PATH, JSON.stringify(data, null, 2));
}

/**
 * CircleCI job data contains data for each job.
 *
 * The data in this file is at the JOB level.
 */
export function loadJobMetrics(): any {
  return JSON.parse(fs.readFileSync(JOB_METRICS_PATH, 'utf-8'));
}
export function saveJobMetrics(data: any): any {
  console.log(`saving job metrics to ${JOB_METRICS_PATH}`);
  fs.writeFileSync(JOB_METRICS_PATH, JSON.stringify(data, null, 2));
}

/**
 * CircleCI job data contains data for each job.
 *
 * The data in this file is at the JOB level.
 */
export function loadTestTimings(): { timingData: { test: string; medianRuntime: number }[] } {
  return JSON.parse(fs.readFileSync(TEST_TIMINGS_PATH, 'utf-8'));
}
export function saveTestTimings(data: any): any {
  console.log(`saving timing data to ${TEST_TIMINGS_PATH}`);
  fs.writeFileSync(TEST_TIMINGS_PATH, JSON.stringify(data, null, 2));
}

/**
 * Workflow results provide a summary of tests failures after a workflow has completed.
 * @param data
 */
export function saveWorkflowResults(data: any): any {
  fs.writeFileSync(WORKFLOW_RESULTS_PATH, JSON.stringify(data, null, 2));
}
export function saveWorkflowResultsHTML(data: any): any {
  fs.writeFileSync(WORKFLOW_RESULTS_HTML_PATH, data);
}

/**
 * Loads the configuration file that is used as a base for generated the final configuration.
 */
export function loadConfig(): CircleCIConfig {
  return <CircleCIConfig>yaml.load(fs.readFileSync(CIRCLECI_BASE_CONFIG_PATH, 'utf8'));
}
/**
 * Saves the generated configuration file that will be used by the continuation orb after the setup has completed.
 * @param config
 */
export function saveConfig(config: CircleCIConfig): void {
  const output = ['# auto generated file. Edit config.base.yaml if you want to change', yaml.dump(config, { noRefs: true })];
  fs.writeFileSync(CIRCLECI_GENERATED_CONFIG_PATH, output.join('\n'));
}

/**
 * Before split-e2e-tests-v2, this is how we generated job names when each file was assigned to a single job.
 *
 * @param baseJobName The root level folder (amplify-e2e-tests, amplify-migration-tests, etc...)
 * @param testSuitePath The test file name (some-e2e-test.e2e.test.ts, some-test.test.ts)
 * @returns
 */
export function getOldJobName(baseJobName: string, testSuitePath: string): string {
  const startIndex = testSuitePath.lastIndexOf('/') + 1;
  const endIndex = testSuitePath.lastIndexOf('.test');
  let name = testSuitePath.substring(startIndex, endIndex).split('.e2e').join('').split('.').join('-');

  // additional suffixes are added depending on what the 'base job' is called
  // for most tests, they belong to the 'amplify-e2e-tests-pkg' job
  if (baseJobName.includes('pkg')) {
    name = name + '_pkg';
  }
  // some jobs belong to a migration test suite, and so the 'version' is appended to the job name
  // for example:
  // tests included in "amplify_migration_tests_v10" will be assigned to jobs with names like "migration-test-name_v10"
  if (baseJobName.includes('amplify_migration_tests')) {
    const startIndex = baseJobName.lastIndexOf('_');
    name = name + baseJobName.substring(startIndex);
  }
  return name;
}

/**
 * Same as getOldJobName, but excludes the suffixes like "_pkg" or "_v6", etc
 * @param testSuitePath
 * @returns
 */
export const getOldJobNameWithoutSuffixes = (testSuitePath: string): string => {
  const startIndex = testSuitePath.lastIndexOf('/') + 1;
  const endIndex = testSuitePath.lastIndexOf('.test');
  return testSuitePath.substring(startIndex, endIndex).split('.e2e').join('').split('.').join('-');
};

/**
 * For jobs before split-e2e-tests-v2, this function allows you to
 * work backwards from the job name to the test which ran inside of that job.
 *
 * It essentially trims the suffixes from the job name, so you can focus on the test name.
 *
 * A job would typically have a name like "my-test_pkg-l_medium", and the test name is just "my-test".
 * Another example is "my-test_pkg-w_medium", which has a test name of just "my-test".
 * @param jobName
 * @returns
 */
function getTestNameFromOldJobName(jobName: string) {
  // first, remove any _pkg-<executor> from the name
  let name = jobName.split('_pkg-')[0];

  // remove migration suffixes
  name = name.split('_v10-')[0];
  name = name.split('_v5-')[0];
  name = name.split('_v6-')[0];
  return name;
}

/**
 * This method uses old job data (before split-e2e-tests-v2) and the timings for those jobs
 * to determine how long a test file takes to run.
 *
 * @returns
 */
export function getTimingsFromJobsData() {
  const jobData = loadJobMetrics();
  const jobTimings: Map<string, number> = new Map();
  for (let job of jobData.items) {
    const testName = getTestNameFromOldJobName(job.name);
    const duration = Math.floor(job.metrics.duration_metrics.median / 60);
    if (jobTimings.has(testName)) {
      jobTimings.set(testName, Math.max(jobTimings.get(testName)!, duration));
    } else {
      jobTimings.set(testName, duration);
    }
  }
  return jobTimings;
}

/**
 * This method can be used to get the 'slowest' tests from all tests.
 * Note: 'tests' do not mean 'test files' in this case. A 'test file' may contain multiple tests.
 * Anywhere else, we treat a 'test file' as a single test.
 * This is more specific, and looks at the sub-tests inside of each file.
 * @param testSuites
 * @returns
 */
export const getSlowestTestsRunTimes = (testSuites: string[]) => {
  const testData = loadTestMetrics();
  // default sorted by slowest -> fastest
  const slowestTests: any[] = testData.slowest_tests.map((t: any) => {
    return {
      file: t.file,
      duration: Math.floor(t.p95_duration / 60),
    };
  });

  return testSuites.map((t) => {
    let slowTest = slowestTests.find((slowTest) => slowTest.file === t);
    if (slowTest) {
      return {
        test: t,
        mins: slowTest.duration,
      };
    } else {
      return {
        test: t,
        mins: 10, // all "not slow" tests run in about 10 mins or less
      };
    }
  });
};
