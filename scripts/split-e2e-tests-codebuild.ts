import { globSync } from 'glob';
import * as fs from 'fs-extra';
import { join } from 'path';
import * as yaml from 'js-yaml';
import { REPO_ROOT } from './cci-utils';
import { FORCE_REGION_MAP, getOldJobNameWithoutSuffixes, loadTestTimings, USE_PARENT_ACCOUNT } from './cci-utils';
const CODEBUILD_CONFIG_BASE_PATH = join(REPO_ROOT, 'codebuild_specs', 'e2e_workflow_base.yml');
const CODEBUILD_GENERATE_CONFIG_PATH = join(REPO_ROOT, 'codebuild_specs', 'e2e_workflow_generated');
const RUN_SOLO = [
  'src/__tests__/auth_2c.test.ts',
  'src/__tests__/auth_2e.test.ts',
  'src/__tests__/aws-exports/js-frontend-config.test.ts',
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
  'src/__tests__/hostingPROD.test.ts',
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
  'src/__tests__/transformer-migrations/searchable-migration.test.ts',
  'src/__tests__/uibuilder.test.ts',
  'src/__tests__/tags.test.ts',
  'src/__tests__/schema-model-a.test.ts',
  'src/__tests__/function_2c.test.ts',
  'src/__tests__/storage-2.test.ts',
  'src/__tests__/custom_policies_function.test.ts',
  'src/__tests__/auth_1a.test.ts',
  'src/__tests__/auth-trigger.test.ts',
  'src/__tests__/schema-versioned.test.ts',
  'src/__tests__/schema-model-e.test.ts',
  'src/__tests__/schema-auth-4b.test.ts',
  'src/__tests__/notifications-sms.test.ts',
  'src/__tests__/iam-permissions-boundary.test.ts',
  'src/__tests__/migration/node.function.test.ts',
  'src/__tests__/schema-model-d.test.ts',
  'src/__tests__/schema-model-b.test.ts',
  'src/__tests__/schema-auth-4a.test.ts',
  'src/__tests__/s3-sse.test.ts',
  'src/__tests__/geo-add-b.test.ts',
  'src/__tests__/auth_8b.test.ts',
  'src/__tests__/auth_5e.test.ts',
  'src/__tests__/auth_1c.test.ts',
  'src/__tests__/schema-predictions.test.ts',
  'src/__tests__/schema-model-c.test.ts',
  'src/__tests__/schema-data-access-patterns.test.ts',
  'src/__tests__/schema-auth-6a.test.ts',
  'src/__tests__/schema-auth-4d.test.ts',
  'src/__tests__/frontend_config_drift.test.ts',
  'src/__tests__/env-4.test.ts',
  'src/__tests__/auth_5f.test.ts',
  'src/__tests__/transformer-migrations/model-migration.test.ts',
  'src/__tests__/schema-auth-5c.test.ts',
  'src/__tests__/schema-auth-4c.test.ts',
  'src/__tests__/init_a.test.ts',
  'src/__tests__/geo-add-a.test.ts',
  'src/__tests__/env-1.test.ts',
  'src/__tests__/auth_5c.test.ts',
  'src/__tests__/auth_5a.test.ts',
  'src/__tests__/auth_4c.test.ts',
  'src/__tests__/auth_3c.test.ts',
  'src/__tests__/schema-auth-8c.test.ts',
  'src/__tests__/schema-auth-6b.test.ts',
  'src/__tests__/schema-auth-5d.test.ts',
  'src/__tests__/global_sandbox-b.test.ts',
  'src/__tests__/geo-import-2.test.ts',
  'src/__tests__/geo-import-1a.test.ts',
  'src/__tests__/function_9c.test.ts',
  'src/__tests__/function_10.test.ts',
  'src/__tests__/function-permissions.test.ts',
  'src/__tests__/env-5.test.ts',
  'src/__tests__/auth_9.test.ts',
  'src/__tests__/auth_5b.test.ts',
  'src/__tests__/schema-auth-8a.test.ts',
  'src/__tests__/schema-auth-7c.test.ts',
  'src/__tests__/schema-auth-6d.test.ts',
  'src/__tests__/schema-auth-6c.test.ts',
  'src/__tests__/schema-auth-2b.test.ts',
  'src/__tests__/schema-auth-11-c.test.ts',
  'src/__tests__/notifications-analytics-compatibility-in-app-2.test.ts',
  'src/__tests__/init_e.test.ts',
  'src/__tests__/global_sandbox-a.test.ts',
  'src/__tests__/geo-import-1b.test.ts',
  'src/__tests__/feature-flags.test.ts',
  'src/__tests__/auth_8c.test.ts',
  'src/__tests__/auth_7a.test.ts',
  'src/__tests__/auth_4a.test.ts',
  'src/__tests__/auth_3b.test.ts',
  'src/__tests__/auth_3a.test.ts',
  'src/__tests__/transformer-migrations/function-migration.test.ts',
  'src/__tests__/storage-3.test.ts',
  'src/__tests__/schema-auth-9-c.test.ts',
  'src/__tests__/schema-auth-9-a.test.ts',
  'src/__tests__/schema-auth-8b.test.ts',
  'src/__tests__/schema-auth-5b.test.ts',
  'src/__tests__/schema-auth-1a.test.ts',
  'src/__tests__/geo-headless.test.ts',
  'src/__tests__/function_9a.test.ts',
  'src/__tests__/export-pull-a.test.ts',
  'src/__tests__/api_7.test.ts',
  'src/__tests__/api_10.test.ts',
  'src/__tests__/migration/api.key.migration5.test.ts',
  'src/__tests__/schema-auth-9-b.test.ts',
  'src/__tests__/schema-auth-7b.test.ts',
  'src/__tests__/schema-auth-7a.test.ts',
  'src/__tests__/schema-auth-2a.test.ts',
  'src/__tests__/schema-auth-1b.test.ts',
  'src/__tests__/schema-auth-11-b.test.ts',
  'src/__tests__/predictions.test.ts',
];
const DISABLE_COVERAGE = [
  'src/__tests__/datastore-modelgen.test.ts',
  'src/__tests__/amplify-app.test.ts',
  'src/__tests__/smoke-tests/smoketest-amplify-app.test.ts',
];
const TEST_EXCLUSIONS: { l: string[]; w: string[] } = {
  l: [],
  w: [
    /* TEMPORARY-PR12830: Remove after we ship PR12830 */
    'src/__tests__/custom_resources.test.ts',
    'src/__tests__/custom-resource-with-storage.test.ts',
    /* END TEMPORARY */
    'src/__tests__/smoketest.test.ts',
    'src/__tests__/opensearch-simulator/opensearch-simulator.test.ts',
    'src/__tests__/storage-simulator/S3server.test.ts',
    'src/__tests__/amplify-app.test.ts',
    'src/__tests__/smoke-tests/smoketest-amplify-app.test.ts',
    // failing in parsing JSON strings on powershell
    'src/__tests__/auth_2g.test.ts',
    'src/__tests__/auth_12.test.ts',
    'src/__tests__/datastore-modelgen.test.ts',
    'src/__tests__/diagnose.test.ts',
    'src/__tests__/env-2.test.ts',
    'src/__tests__/pr-previews-multi-env-1.test.ts',
    'src/__tests__/export.test.ts',
    'src/__tests__/function_3a_dotnet.test.ts',
    'src/__tests__/function_3a_python.test.ts',
    'src/__tests__/function_3a_go.test.ts',
    'src/__tests__/function_3a_nodejs.test.ts',
    'src/__tests__/function_3b.test.ts',
    'src/__tests__/function_4.test.ts',
    'src/__tests__/function_6.test.ts',
    'src/__tests__/function_7.test.ts',
    'src/__tests__/function_8.test.ts',
    'src/__tests__/function_15.test.ts',
    'src/__tests__/geo-add-e.test.ts',
    'src/__tests__/geo-add-f.test.ts',
    'src/__tests__/geo-remove-2.test.ts',
    'src/__tests__/geo-remove-3.test.ts',
    'src/__tests__/geo-update-1.test.ts',
    'src/__tests__/geo-update-2.test.ts',
    'src/__tests__/git-clone-attach.test.ts',
    'src/__tests__/hooks-a.test.ts',
    'src/__tests__/hooks-c.test.ts',
    'src/__tests__/import_auth_1a.test.ts',
    'src/__tests__/import_auth_1b.test.ts',
    'src/__tests__/import_auth_2a.test.ts',
    'src/__tests__/import_auth_2b.test.ts',
    'src/__tests__/import_auth_3.test.ts',
    'src/__tests__/import_dynamodb_2a.test.ts',
    'src/__tests__/import_dynamodb_2b.test.ts',
    'src/__tests__/import_dynamodb_2c.test.ts',
    'src/__tests__/import_s3_2a.test.ts',
    'src/__tests__/import_s3_2b.test.ts',
    'src/__tests__/import_s3_2c.test.ts',
    'src/__tests__/layer-2.test.ts',
    'src/__tests__/mock-api.test.ts',
    'src/__tests__/pull.test.ts',
    'src/__tests__/pull-2.test.ts',
    'src/__tests__/schema-iterative-rollback-1.test.ts',
    'src/__tests__/schema-iterative-rollback-2.test.ts',
    'src/__tests__/storage-5.test.ts',
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
    'src/__tests__/auth_2c.test.ts',
    'src/__tests__/auth_2e.test.ts',
    'src/__tests__/aws-exports/js-frontend-config.test.ts',
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
    'src/__tests__/hostingPROD.test.ts',
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
    'src/__tests__/transformer-migrations/searchable-migration.test.ts',
    'src/__tests__/uibuilder.test.ts',
    'src/__tests__/tags.test.ts',
    'src/__tests__/schema-model-a.test.ts',
    'src/__tests__/function_2c.test.ts',
    'src/__tests__/storage-2.test.ts',
    'src/__tests__/custom_policies_function.test.ts',
    'src/__tests__/auth_1a.test.ts',
    'src/__tests__/auth-trigger.test.ts',
    'src/__tests__/schema-versioned.test.ts',
    'src/__tests__/schema-model-e.test.ts',
    'src/__tests__/schema-auth-4b.test.ts',
    'src/__tests__/notifications-sms.test.ts',
    'src/__tests__/iam-permissions-boundary.test.ts',
    'src/__tests__/migration/node.function.test.ts',
    'src/__tests__/schema-model-d.test.ts',
    'src/__tests__/schema-model-b.test.ts',
    'src/__tests__/schema-auth-4a.test.ts',
    'src/__tests__/s3-sse.test.ts',
    'src/__tests__/geo-add-b.test.ts',
    'src/__tests__/auth_8b.test.ts',
    'src/__tests__/auth_5e.test.ts',
    'src/__tests__/auth_1c.test.ts',
    'src/__tests__/schema-predictions.test.ts',
    'src/__tests__/schema-model-c.test.ts',
    'src/__tests__/schema-data-access-patterns.test.ts',
    'src/__tests__/schema-auth-6a.test.ts',
    'src/__tests__/schema-auth-4d.test.ts',
    'src/__tests__/frontend_config_drift.test.ts',
    'src/__tests__/env-4.test.ts',
    'src/__tests__/auth_5f.test.ts',
    'src/__tests__/transformer-migrations/model-migration.test.ts',
    'src/__tests__/schema-auth-5c.test.ts',
    'src/__tests__/schema-auth-4c.test.ts',
    'src/__tests__/init_a.test.ts',
    'src/__tests__/geo-add-a.test.ts',
    'src/__tests__/env-1.test.ts',
    'src/__tests__/auth_5c.test.ts',
    'src/__tests__/auth_5a.test.ts',
    'src/__tests__/auth_4c.test.ts',
    'src/__tests__/auth_3c.test.ts',
    'src/__tests__/schema-auth-8c.test.ts',
    'src/__tests__/schema-auth-6b.test.ts',
    'src/__tests__/schema-auth-5d.test.ts',
    'src/__tests__/global_sandbox-b.test.ts',
    'src/__tests__/geo-import-2.test.ts',
    'src/__tests__/geo-import-1a.test.ts',
    'src/__tests__/function_9c.test.ts',
    'src/__tests__/function_10.test.ts',
    'src/__tests__/function-permissions.test.ts',
    'src/__tests__/env-5.test.ts',
    'src/__tests__/auth_9.test.ts',
    'src/__tests__/auth_5b.test.ts',
    'src/__tests__/schema-auth-8a.test.ts',
    'src/__tests__/schema-auth-7c.test.ts',
    'src/__tests__/schema-auth-6d.test.ts',
    'src/__tests__/schema-auth-6c.test.ts',
    'src/__tests__/schema-auth-2b.test.ts',
    'src/__tests__/schema-auth-11-c.test.ts',
    'src/__tests__/notifications-analytics-compatibility-in-app-2.test.ts',
    'src/__tests__/init_e.test.ts',
    'src/__tests__/global_sandbox-a.test.ts',
    'src/__tests__/geo-import-1b.test.ts',
    'src/__tests__/feature-flags.test.ts',
    'src/__tests__/auth_8c.test.ts',
    'src/__tests__/auth_7a.test.ts',
    'src/__tests__/auth_4a.test.ts',
    'src/__tests__/auth_3b.test.ts',
    'src/__tests__/auth_3a.test.ts',
    'src/__tests__/transformer-migrations/function-migration.test.ts',
    'src/__tests__/storage-3.test.ts',
    'src/__tests__/schema-auth-9-c.test.ts',
    'src/__tests__/schema-auth-9-a.test.ts',
    'src/__tests__/schema-auth-8b.test.ts',
    'src/__tests__/schema-auth-5b.test.ts',
    'src/__tests__/schema-auth-1a.test.ts',
    'src/__tests__/geo-headless.test.ts',
    'src/__tests__/function_9a.test.ts',
    'src/__tests__/export-pull-a.test.ts',
    'src/__tests__/api_7.test.ts',
    'src/__tests__/api_10.test.ts',
    'src/__tests__/migration/api.key.migration5.test.ts',
    'src/__tests__/schema-auth-9-b.test.ts',
    'src/__tests__/schema-auth-7b.test.ts',
    'src/__tests__/schema-auth-7a.test.ts',
    'src/__tests__/schema-auth-2a.test.ts',
    'src/__tests__/schema-auth-1b.test.ts',
    'src/__tests__/schema-auth-11-b.test.ts',
    'src/__tests__/predictions.test.ts',
  ],
};
export function loadConfigBase() {
  return yaml.load(fs.readFileSync(CODEBUILD_CONFIG_BASE_PATH, 'utf8'));
}
export function saveConfig(config: any): void {
  const output = ['# auto generated file. DO NOT EDIT manually', yaml.dump(config, { noRefs: true, lineWidth: -1 })];
  fs.writeFileSync(`${CODEBUILD_GENERATE_CONFIG_PATH}.yml`, output.join('\n'));
}
export function getTestFiles(dir: string, pattern = 'src/**/*.test.ts'): string[] {
  return globSync(pattern, { cwd: dir });
}
type COMPUTE_TYPE = 'BUILD_GENERAL1_MEDIUM' | 'BUILD_GENERAL1_LARGE';
type BatchBuildJob = {
  identifier: string;
  env: {
    'compute-type'?: COMPUTE_TYPE;
    variables: [string: string];
  };
};
type ConfigBase = {
  batch: {
    'build-graph': BatchBuildJob[];
    'fast-fail': boolean;
  };
  env: {
    'compute-type': COMPUTE_TYPE;
    shell: 'bash';
    variables: [string: string];
  };
};
const MAX_WORKERS = 3;
const MAX_WORKERS_WINDOWS = 2;
type OS_TYPE = 'w' | 'l';
type CandidateJob = {
  region?: string;
  os: OS_TYPE;
  executor: string;
  tests: string[];
  useParentAccount: boolean;
  disableCoverage: boolean;
};
const createRandomJob = (os: OS_TYPE): CandidateJob => {
  return {
    os,
    executor: os === 'l' ? 'l_large' : 'w_medium',
    tests: [],
    useParentAccount: false,
    disableCoverage: false,
  };
};
const splitTestsV3 = (
  baseJobLinux: any,
  baseJobWindows: any,
  testDirectory: string,
  isMigration: boolean,
  pickTests: ((testSuites: string[]) => string[]) | undefined,
) => {
  const output: any[] = [];
  let testSuites = getTestFiles(testDirectory);
  if (pickTests && typeof pickTests === 'function') {
    testSuites = pickTests(testSuites);
  }
  if (testSuites.length === 0) {
    return output;
  }
  const testFileRunTimes = loadTestTimings().timingData;

  testSuites.sort((a, b) => {
    const runtimeA = testFileRunTimes.find((t) => t.test === a)?.medianRuntime ?? 30;
    const runtimeB = testFileRunTimes.find((t) => t.test === b)?.medianRuntime ?? 30;
    return runtimeA - runtimeB;
  });
  const generateJobsForOS = (os: OS_TYPE) => {
    if (os == 'l') {
      return [];
    }
    // migration tests are not supported for windows
    if (isMigration && os === 'w') {
      return [];
    }
    const soloJobs = [];
    const osJobs = [createRandomJob(os)];
    for (let test of testSuites) {
      const currentJob = osJobs[osJobs.length - 1];

      // if the current test is excluded from this OS, skip it
      if (TEST_EXCLUSIONS[os].find((excluded) => test === excluded)) {
        continue;
      }
      const FORCE_REGION = FORCE_REGION_MAP.get(test);
      const USE_PARENT = USE_PARENT_ACCOUNT.some((usesParent) => test.startsWith(usesParent));
      const NO_COVERAGE = DISABLE_COVERAGE.find((nocov) => test === nocov);

      if (isMigration || RUN_SOLO.find((solo) => test === solo) || NO_COVERAGE) {
        const newSoloJob = createRandomJob(os);
        newSoloJob.tests.push(test);
        if (FORCE_REGION) {
          newSoloJob.region = FORCE_REGION;
        }
        if (USE_PARENT) {
          newSoloJob.useParentAccount = true;
        }
        if (NO_COVERAGE) {
          newSoloJob.disableCoverage = true;
        }
        soloJobs.push(newSoloJob);
        continue;
      }

      // add the test
      currentJob.tests.push(test);
      if (FORCE_REGION) {
        currentJob.region = FORCE_REGION;
      }
      if (USE_PARENT) {
        currentJob.useParentAccount = true;
      }

      const maxWorkers = os === 'w' ? MAX_WORKERS_WINDOWS : MAX_WORKERS;
      // create a new job once the current job is full;
      if (currentJob.tests.length >= maxWorkers) {
        osJobs.push(createRandomJob(os));
      }
    }
    return [...osJobs, ...soloJobs];
  };
  const linuxJobs = generateJobsForOS('l');
  const windowsJobs = generateJobsForOS('w');
  const getIdentifier = (os: string, names: string) => {
    let jobName = `${os}_${names.replace(/-/g, '_')}`.substring(0, 127);
    if (isMigration) {
      const startIndex = baseJobLinux.identifier.lastIndexOf('_');
      jobName = jobName + baseJobLinux.identifier.substring(startIndex);
    }
    return jobName;
  };
  const result: any[] = [];
  const dependeeIdentifiers: string[] = [];
  linuxJobs.forEach((job) => {
    if (job.tests.length !== 0) {
      const names = job.tests.map((tn) => getOldJobNameWithoutSuffixes(tn)).join('_');
      const identifier = getIdentifier(job.os, names);
      dependeeIdentifiers.push(identifier);
      const formattedJob = {
        ...JSON.parse(JSON.stringify(baseJobLinux)), // deep clone base job
        identifier,
      };
      formattedJob.env.variables = {};
      if (isMigration || job.tests.length === 1) {
        formattedJob.env.variables['compute-type'] = 'BUILD_GENERAL1_SMALL';
      }
      formattedJob.env.variables.TEST_SUITE = job.tests.join('|');
      if (job.region) {
        // Jobs with forced region are assigned one explicitly.
        // Otherwise, region is assigned at runtime by select-region-for-e2e-test.ts script.
        formattedJob.env.variables.CLI_REGION = job.region;
      }
      if (job.useParentAccount) {
        formattedJob.env.variables.USE_PARENT_ACCOUNT = 1;
      }
      if (job.disableCoverage) {
        formattedJob.env.variables.DISABLE_COVERAGE = 1;
      }
      result.push(formattedJob);
    }
  });
  windowsJobs.forEach((job) => {
    if (job.tests.length !== 0) {
      const names = job.tests.map((tn) => getOldJobNameWithoutSuffixes(tn)).join('_');
      const identifier = getIdentifier(job.os, names);
      dependeeIdentifiers.push(identifier);
      const formattedJob = {
        ...JSON.parse(JSON.stringify(baseJobWindows)), // deep clone base job
        identifier,
      };
      formattedJob.env.variables = {};
      formattedJob.env.variables.TEST_SUITE = job.tests.join('|');
      if (job.region) {
        // Jobs with forced region are assigned one explicitly.
        // Otherwise, region is assigned at runtime by select-region-for-e2e-test.ts script.
        formattedJob.env.variables.CLI_REGION = job.region;
      }
      if (job.useParentAccount) {
        formattedJob.env.variables.USE_PARENT_ACCOUNT = 1;
      }
      if (job.disableCoverage) {
        formattedJob.env.variables.DISABLE_COVERAGE = 1;
      }
      result.push(formattedJob);
    }
  });
  return result;
};
function main(): void {
  const configBase: any = loadConfigBase();
  const baseBuildGraph = configBase.batch['build-graph'];
  const splitE2ETests = splitTestsV3(
    {
      identifier: 'run_e2e_tests_linux',
      buildspec: 'codebuild_specs/run_e2e_tests_linux.yml',
      env: {},
      'depend-on': ['upb'],
    },
    {
      identifier: 'run_e2e_tests_windows',
      buildspec: 'codebuild_specs/run_e2e_tests_windows.yml',
      env: {
        type: 'WINDOWS_SERVER_2019_CONTAINER',
        image: '$WINDOWS_IMAGE_2019',
      },
      'depend-on': ['build_windows', 'upb'],
    },
    join(REPO_ROOT, 'packages', 'amplify-e2e-tests'),
    false,
    undefined,
  );

  let allBuilds = [...splitE2ETests];
  const dependeeIdentifiers: string[] = allBuilds.map((buildObject) => buildObject.identifier).sort();
  const dependeeIdentifiersFileContents = `${JSON.stringify(dependeeIdentifiers, null, 2)}\n`;
  const waitForIdsFilePath = './codebuild_specs/wait_for_ids.json';
  fs.writeFileSync(waitForIdsFilePath, dependeeIdentifiersFileContents);
  const reportsAggregator = {
    identifier: 'aggregate_e2e_reports',
    env: {
      'compute-type': 'BUILD_GENERAL1_MEDIUM',
      variables: { WAIT_FOR_IDS_FILE_PATH: waitForIdsFilePath },
    },
    buildspec: 'codebuild_specs/aggregate_e2e_reports.yml',
    'depend-on': ['upb'],
  };
  allBuilds.push(reportsAggregator);
  let currentBatch = [...baseBuildGraph, ...allBuilds];
  configBase.batch['build-graph'] = currentBatch;
  saveConfig(configBase);
}
main();
