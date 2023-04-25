import * as glob from 'glob';
import * as fs from 'fs-extra';
import { join } from 'path';
import * as yaml from 'js-yaml';
import { AWS_REGIONS_TO_RUN_TESTS as regions } from './cci-utils';
import { REPO_ROOT } from './cci-utils';
import { FORCE_REGION_MAP, getOldJobNameWithoutSuffixes, loadTestTimings, USE_PARENT_ACCOUNT } from './cci-utils';
import { migrationFromV10Tests, migrationFromV5Tests, migrationFromV6Tests } from './split-e2e-test-filters';
const CIRCLECI_GENERATED_CONFIG_BASE_PATH = join(REPO_ROOT, '.circleci', 'generated_config.yml');
const CODEBUILD_CONFIG_BASE_PATH = join(REPO_ROOT, 'codebuild_specs', 'e2e_workflow_base.yml');
const CODEBUILD_GENERATE_CONFIG_PATH = join(REPO_ROOT, 'codebuild_specs', 'e2e_workflow_generated');
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
];
const TEST_EXCLUSIONS: { l: string[]; w: string[] } = {
  l: [],
  w: [
    'src/__tests__/opensearch-simulator/opensearch-simulator.test.ts',
    'src/__tests__/storage-simulator/S3server.test.ts',
    'src/__tests__/amplify-app.test.ts',
    // failing in parsing JSON strings on powershell
    'src/__tests__/auth_12.test.ts',
    'src/__tests__/datastore-modelgen.test.ts',
    'src/__tests__/diagnose.test.ts',
    'src/__tests__/env-2.test.ts',
    'src/__tests__/export.test.ts',
    'src/__tests__/function_3a.test.ts',
    'src/__tests__/function_3b.test.ts',
    'src/__tests__/function_4.test.ts',
    'src/__tests__/function_6.test.ts',
    'src/__tests__/function_7.test.ts',
    'src/__tests__/function_8.test.ts',
    'src/__tests__/geo-add-e.test.ts',
    'src/__tests__/geo-add-f.test.ts',
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
    'src/__tests__/import_dynamodb_2b.test.ts',
    'src/__tests__/import_dynamodb_2c.test.ts',
    'src/__tests__/import_s3_2a.test.ts',
    'src/__tests__/import_s3_2b.test.ts',
    'src/__tests__/import_s3_2c.test.ts',
    'src/__tests__/layer-2.test.ts',
    'src/__tests__/mock-api.test.ts',
    'src/__tests__/pull.test.ts',
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
  ],
};
export function loadConfigBase() {
  return yaml.load(fs.readFileSync(CODEBUILD_CONFIG_BASE_PATH, 'utf8'));
}
export function saveConfig(config: any, batch: number): void {
  const output = ['# auto generated file. DO NOT EDIT manually', yaml.dump(config, { noRefs: true })];
  fs.writeFileSync(`${CODEBUILD_GENERATE_CONFIG_PATH}_${batch}.yml`, output.join('\n'));
}
function getTestFiles(dir: string, pattern = 'src/**/*.test.ts'): string[] {
  return glob.sync(pattern, { cwd: dir });
}
type COMPUTE_TYPE = 'BUILD_GENERAL1_MEDIUM' | 'BUILD_GENERAL1_LARGE';
type BatchBuildJob = {
  identifier: string;
  env: {
    'compute-type': COMPUTE_TYPE;
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
const MAX_WORKERS = 4;
type OS_TYPE = 'w' | 'l';
type CandidateJob = {
  region: string;
  os: OS_TYPE;
  executor: string;
  tests: string[];
  useParentAccount: boolean;
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

      if (isMigration || RUN_SOLO.find((solo) => test === solo)) {
        const newSoloJob = createRandomJob(os);
        newSoloJob.tests.push(test);
        if (FORCE_REGION) {
          newSoloJob.region = FORCE_REGION;
        }
        if (USE_PARENT) {
          newSoloJob.useParentAccount = true;
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

      // create a new job once the current job is full;
      if (currentJob.tests.length >= MAX_WORKERS) {
        osJobs.push(createRandomJob(os));
      }
    }
    return [...osJobs, ...soloJobs];
  };
  const linuxJobs = generateJobsForOS('l');
  const windowsJobs = generateJobsForOS('w');
  const getIdentifier = (os: string, names: string) => {
    return `${os}_${names.replace(/-/g, '_')}`.substring(0, 127);
  };
  const result: any[] = [];
  linuxJobs.forEach((j) => {
    if (j.tests.length !== 0) {
      const names = j.tests.map((tn) => getOldJobNameWithoutSuffixes(tn)).join('_');
      const tmp = {
        ...baseJobLinux,
        identifier: getIdentifier(j.os, names),
      };
      tmp.env.TEST_SUITE = j.tests;
      tmp.env.CLI_REGION = j.region;
      tmp.env.USE_PARENT_ACCOUNT = j.useParentAccount;
      result.push(tmp);
    }
  });
  windowsJobs.forEach((j) => {
    if (j.tests.length !== 0) {
      const names = j.tests.map((tn) => getOldJobNameWithoutSuffixes(tn)).join('_');
      const tmp = {
        ...baseJobWindows,
        identifier: getIdentifier(j.os, names),
      };
      tmp.env.TEST_SUITE = j.tests;
      tmp.env.CLI_REGION = j.region;
      tmp.env.USE_PARENT_ACCOUNT = j.useParentAccount;
      result.push(tmp);
    }
  });
  return result;
};
function main(): void {
  const generated: any = yaml.load(fs.readFileSync(CIRCLECI_GENERATED_CONFIG_BASE_PATH, 'utf8'));
  const testJobs = [];
  for (let k of Object.keys(generated.jobs)) {
    const v = generated.jobs[k];
    if (v.environment && v.environment.TEST_SUITE) {
      testJobs.push(v.environment.TEST_SUITE);
    }
  }
  const configBase: any = loadConfigBase();
  const baseBuildGraph = configBase.batch['build-graph'];

  const counts = { w: 0, l: 0 };
  const splitE2ETests = splitTestsV3(
    {
      identifier: 'run_e2e_tests_linux',
      buildspec: 'codebuild_specs/run_e2e_tests_linux.yml',
      env: {
        'compute-type': 'BUILD_GENERAL1_LARGE',
      },
      'depend-on': ['upload_pkg_binaries'],
    },
    {
      identifier: 'run_e2e_tests_windows',
      buildspec: 'codebuild_specs/run_e2e_tests_windows.yml',
      env: {
        type: 'WINDOWS_SERVER_2019_CONTAINER',
        'compute-type': 'BUILD_GENERAL1_LARGE',
        image: '$WINDOWS_IMAGE_2019',
      },
      'depend-on': ['build_windows', 'upload_pkg_binaries'],
    },
    join(REPO_ROOT, 'packages', 'amplify-e2e-tests'),
    false,
    undefined,
  );
  const splitMigrationV5Tests = splitTestsV3(
    {
      identifier: 'migration_tests_v5',
      buildspec: 'codebuild_specs/migration_tests_v5.yml',
      env: {
        'compute-type': 'BUILD_GENERAL1_LARGE',
      },
      'depend-on': ['upload_pkg_binaries'],
    },
    undefined,
    join(REPO_ROOT, 'packages', 'amplify-migration-tests'),
    true,
    (tests: string[]) => {
      return tests.filter((testName) => migrationFromV5Tests.find((t) => t === testName));
    },
  );
  const splitMigrationV6Tests = splitTestsV3(
    {
      identifier: 'migration_tests_v6',
      buildspec: 'codebuild_specs/migration_tests_v6.yml',
      env: {
        'compute-type': 'BUILD_GENERAL1_LARGE',
      },
      'depend-on': ['upload_pkg_binaries'],
    },
    undefined,
    join(REPO_ROOT, 'packages', 'amplify-migration-tests'),
    true,
    (tests: string[]) => {
      return tests.filter((testName) => migrationFromV6Tests.find((t) => t === testName));
    },
  );
  const splitMigrationV10Tests = splitTestsV3(
    {
      identifier: 'migration_tests_v10',
      buildspec: 'codebuild_specs/migration_tests_v10.yml',
      env: {
        'compute-type': 'BUILD_GENERAL1_LARGE',
      },
      'depend-on': ['upload_pkg_binaries'],
    },
    undefined,
    join(REPO_ROOT, 'packages', 'amplify-migration-tests'),
    true,
    (tests: string[]) => {
      return tests.filter((testName) => migrationFromV10Tests.find((t) => t === testName));
    },
  );
  let allBuilds = [...splitE2ETests, ...splitMigrationV5Tests, ...splitMigrationV6Tests, ...splitMigrationV10Tests];
  let batch = 1;
  let maxBatchSize = 100;
  let currentBatch = [...baseBuildGraph];
  let shouldSave = true;
  for (let build of allBuilds) {
    if (currentBatch.length < maxBatchSize) {
      currentBatch.push(build);
      shouldSave = true;
    } else {
      configBase.batch['build-graph'] = currentBatch;
      saveConfig(configBase, batch);
      batch++;
      currentBatch = [...baseBuildGraph];
      shouldSave = false;
    }
  }
  if (shouldSave) {
    configBase.batch['build-graph'] = currentBatch;
    saveConfig(configBase, batch);
  }
}
main();
