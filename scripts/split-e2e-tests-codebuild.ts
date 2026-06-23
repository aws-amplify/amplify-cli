import { globSync } from 'glob';
import * as fs from 'fs-extra';
import { join } from 'path';
import * as yaml from 'js-yaml';
import { REPO_ROOT } from './cci-utils';
import { FORCE_REGION_MAP, getOldJobNameWithoutSuffixes, loadTestTimings, USE_PARENT_ACCOUNT } from './cci-utils';
const CODEBUILD_CONFIG_BASE_PATH = join(REPO_ROOT, 'codebuild_specs', 'e2e_workflow_base.yml');
const CODEBUILD_GENERATE_CONFIG_PATH = join(REPO_ROOT, 'codebuild_specs', 'e2e_workflow_generated');

/**
 * Time-barrier wave staggering tunables for the e2e CodeBuild batch.
 *
 * The orchestrator that fans the batch out cannot schedule the full ~280-shard
 * burst at once (it fails with a CoFaWorkflows "Internal Service Error"). To
 * spread dispatch over time WITHOUT serializing wave completion, shards are
 * grouped into waves. Wave 1 starts immediately after `upb`/`build_windows`;
 * each later wave is gated behind a synthetic "barrier" build that only sleeps.
 * All barriers depend solely on `upb`/`build_windows`, so they all start in
 * parallel right after the package upload — the stagger comes purely from their
 * differing sleep durations, NOT from chaining one wave's completion to the next.
 */
// Number of shards per wave (per OS). Wave 1 has no barrier.
const E2E_WAVE_SIZE = 50;
// Seconds added per wave to the barrier sleep. Wave k sleeps (k-1) * interval.
const E2E_WAVE_BARRIER_INTERVAL_SEC = 300;
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
];
const RUN_DUO = [
  'src/__tests__/api_6c.test.ts',
  'src/__tests__/auth_9.test.ts',
  'src/__tests__/function_2a.test.ts',
  'src/__tests__/geo-add-d.test.ts',
  'src/__tests__/migration/api.key.migration5.test.ts',
  'src/__tests__/export-pull-a.test.ts',
  'src/__tests__/export-pull-c.test.ts',
  'src/__tests__/hosting.test.ts',
  'src/__tests__/notifications-analytics-compatibility-in-app-2.test.ts',
  'src/__tests__/schema-iterative-update-4.test.ts',
  'src/__tests__/schema-searchable.test.ts',
  'src/__tests__/studio-modelgen.test.ts',
];
const DISABLE_COVERAGE = [
  'src/__tests__/datastore-modelgen.test.ts',
  'src/__tests__/amplify-app.test.ts',
  'src/__tests__/smoke-tests/smoketest-amplify-app.test.ts',
  'src/__tests__/gen2-migration/gen2-migration-backend-only.test.ts',
  'src/__tests__/gen2-migration/gen2-migration-discussions.test.ts',
  'src/__tests__/gen2-migration/gen2-migration-fitness-tracker.test.ts',
  'src/__tests__/gen2-migration/gen2-migration-finance-tracker.test.ts',
  'src/__tests__/gen2-migration/gen2-migration-media-vault.test.ts',
  'src/__tests__/gen2-migration/gen2-migration-mood-board.test.ts',
  'src/__tests__/gen2-migration/gen2-migration-product-catalog.test.ts',
  'src/__tests__/gen2-migration/gen2-migration-project-boards.test.ts',
  'src/__tests__/gen2-migration/gen2-migration-store-locator.test.ts',
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
    // gen2-migration tests dont currently work on windows because of 'Could not resolve credentials using profile'.
    // need to dive deeper to figure it out.
    'src/__tests__/gen2-migration/gen2-migration-backend-only.test.ts',
    'src/__tests__/gen2-migration/gen2-migration-discussions.test.ts',
    'src/__tests__/gen2-migration/gen2-migration-fitness-tracker.test.ts',
    'src/__tests__/gen2-migration/gen2-migration-finance-tracker.test.ts',
    'src/__tests__/gen2-migration/gen2-migration-media-vault.test.ts',
    'src/__tests__/gen2-migration/gen2-migration-mood-board.test.ts',
    'src/__tests__/gen2-migration/gen2-migration-product-catalog.test.ts',
    'src/__tests__/gen2-migration/gen2-migration-project-boards.test.ts',
    'src/__tests__/gen2-migration/gen2-migration-store-locator.test.ts',
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
    // migration tests are not supported for windows
    if (isMigration && os === 'w') {
      return [];
    }
    const soloJobs = [];
    const osJobs = [createRandomJob(os)];
    for (let test of testSuites) {
      let currentJob = osJobs[osJobs.length - 1];

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

      let maxWorkers = os === 'w' ? MAX_WORKERS_WINDOWS : MAX_WORKERS;
      if (os === 'l' && (RUN_DUO.find((duo) => test === duo) || currentJob.tests.some((duo) => RUN_DUO.includes(duo)))) {
        maxWorkers = 2;
        // if we had a test that requires it is in a job with only 2 tests and a job already has 2 tests, set up a new job
        // this may mean there will occasionally be jobs that can run with 3 tests will be running with 2
        if (currentJob.tests.length === maxWorkers) {
          osJobs.push(createRandomJob(os));
          currentJob = osJobs[osJobs.length - 1];
        }
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
      const isGen2Migration = job.tests.some((t) => t.includes('gen2-migration'));
      if (isGen2Migration) {
        formattedJob.env.variables['compute-type'] = 'BUILD_GENERAL1_LARGE';
      } else if (isMigration || job.tests.length === 1) {
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
/**
 * Builds a synthetic barrier build group whose only job is to sleep, gating a
 * wave of Linux e2e shards. Depends only on `upb` so it starts in parallel with
 * every other barrier; the stagger comes from the sleep duration alone.
 */
function makeLinuxBarrier(identifier: string, wave: number): any {
  const sleepSeconds = (wave - 1) * E2E_WAVE_BARRIER_INTERVAL_SEC;
  return {
    identifier,
    buildspec: `version: 0.2\nphases:\n  build:\n    commands:\n      - sleep ${sleepSeconds}\n`,
    env: { 'compute-type': 'BUILD_GENERAL1_SMALL' },
    'depend-on': ['upb'],
  };
}

/**
 * Builds a synthetic barrier build group gating a wave of Windows e2e shards.
 * Mirrors {@link makeLinuxBarrier} but runs on the Windows container the `w_`
 * shards use and sleeps via PowerShell. Depends only on `build_windows`/`upb`.
 */
function makeWindowsBarrier(identifier: string, wave: number): any {
  const sleepSeconds = (wave - 1) * E2E_WAVE_BARRIER_INTERVAL_SEC;
  return {
    identifier,
    buildspec: `version: 0.2\nenv:\n  shell: powershell.exe\nphases:\n  build:\n    commands:\n      - Start-Sleep -Seconds ${sleepSeconds}\n`,
    env: { type: 'WINDOWS_SERVER_2022_CONTAINER', image: '$WINDOWS_IMAGE_2019' },
    'depend-on': ['build_windows', 'upb'],
  };
}

/**
 * Applies time-barrier wave staggering to the generated e2e shards in place.
 *
 * Splits the `l_`/`w_` shards into waves of {@link E2E_WAVE_SIZE}. Wave 1 keeps
 * its original dependency on `upb` (and `build_windows` for Windows). Each later
 * wave is rewired to depend on a synthetic barrier build instead, so the wave
 * cannot dispatch until that barrier's sleep elapses. Barriers depend only on
 * `upb`/`build_windows` — never on each other or on a prior wave — so dispatch
 * is spread over time without serializing completion.
 *
 * Mutates the `depend-on` of each shard and returns the new barrier build groups.
 */
function applyWaveStaggering(shards: any[]): any[] {
  const barriers: any[] = [];

  const stagger = (osPrefix: 'l' | 'w', keptDeps: string[], makeBarrier: (identifier: string, wave: number) => any): void => {
    const osShards = shards.filter((shard) => shard.identifier.startsWith(`${osPrefix}_`));
    osShards.forEach((shard, index) => {
      const wave = Math.floor(index / E2E_WAVE_SIZE) + 1;
      if (wave === 1) {
        return; // wave 1 keeps its original depend-on (upb / build_windows + upb)
      }
      const barrierId = `${osPrefix}_wave_barrier_${wave}`;
      if (!barriers.some((barrier) => barrier.identifier === barrierId)) {
        barriers.push(makeBarrier(barrierId, wave));
      }
      shard['depend-on'] = [...keptDeps, barrierId];
    });
  };

  stagger('l', [], makeLinuxBarrier);
  stagger('w', ['build_windows'], makeWindowsBarrier);

  return barriers;
}

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
        type: 'WINDOWS_SERVER_2022_CONTAINER',
        image: '$WINDOWS_IMAGE_2019',
      },
      'depend-on': ['build_windows', 'upb'],
    },
    join(REPO_ROOT, 'packages', 'amplify-e2e-tests'),
    false,
    undefined,
  );

  let allBuilds = [...splitE2ETests];
  // Report wait list is the shard identifiers only — barriers are synthetic and
  // must NOT be polled by aggregate_e2e_reports, so compute this before staggering.
  const dependeeIdentifiers: string[] = allBuilds.map((buildObject) => buildObject.identifier).sort();
  const dependeeIdentifiersFileContents = `${JSON.stringify(dependeeIdentifiers, null, 2)}\n`;
  const waitForIdsFilePath = './codebuild_specs/wait_for_ids.json';
  fs.writeFileSync(waitForIdsFilePath, dependeeIdentifiersFileContents);
  // Stagger shard dispatch with time barriers (mutates shard depend-on in place).
  const waveBarriers = applyWaveStaggering(splitE2ETests);
  allBuilds = [...waveBarriers, ...allBuilds];
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
