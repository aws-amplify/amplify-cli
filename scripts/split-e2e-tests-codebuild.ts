import { globSync } from 'glob';
import * as fs from 'fs-extra';
import { join } from 'path';
import * as yaml from 'js-yaml';
import { REPO_ROOT } from './cci-utils';
import { FORCE_REGION_MAP, getOldJobNameWithoutSuffixes, loadTestTimings, USE_PARENT_ACCOUNT } from './cci-utils';
const CODEBUILD_CONFIG_BASE_PATH = join(REPO_ROOT, 'codebuild_specs', 'e2e_workflow_base.yml');
const CODEBUILD_GENERATE_CONFIG_PATH = join(REPO_ROOT, 'codebuild_specs', 'e2e_workflow_generated');
// Additive split-batch outputs. These do NOT replace the combined e2e_workflow_generated.yml above —
// they are an alternative execution mode that fires two separate CodeBuild batches (one Linux, one
// Windows) against the SAME AmplifyCLI-E2E-Testing project to dodge the orchestrator fan-out fault.
const CODEBUILD_GENERATE_LINUX_CONFIG_PATH = join(REPO_ROOT, 'codebuild_specs', 'e2e_workflow_linux_generated');
const CODEBUILD_GENERATE_WINDOWS_CONFIG_PATH = join(REPO_ROOT, 'codebuild_specs', 'e2e_workflow_windows_generated');
const WAIT_FOR_IDS_LINUX_FILE_PATH = './codebuild_specs/wait_for_ids_linux.json';
const WAIT_FOR_IDS_WINDOWS_FILE_PATH = './codebuild_specs/wait_for_ids_windows.json';
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
  saveConfigToPath(config, CODEBUILD_GENERATE_CONFIG_PATH);
}
export function saveConfigToPath(config: any, generatePathWithoutExtension: string): void {
  const output = ['# auto generated file. DO NOT EDIT manually', yaml.dump(config, { noRefs: true, lineWidth: -1 })];
  fs.writeFileSync(`${generatePathWithoutExtension}.yml`, output.join('\n'));
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
 * Maximum number of E2E jobs the batch orchestrator is asked to release at once for the combined
 * workflow (codebuild_specs/e2e_workflow_generated.yml) that the single AmplifyCLI-E2E-Testing
 * start-build-batch consumes. Pointing every one of the ~265 shards at `upb` makes the orchestrator
 * fan the whole set out the instant upb completes, which faults the batch state machine with an
 * "Internal Service Error". Staggering the fan-out into waves of WAVE_SIZE keeps the maximum
 * simultaneous release width at WAVE_SIZE:
 *   - jobs at index < WAVE_SIZE depend on `upb` (wave 0)
 *   - job at index i (i >= WAVE_SIZE) depends on the job at index (i - WAVE_SIZE)
 * Every dependency index is strictly less than i, so the graph stays acyclic and the most jobs
 * released by any single completion event is WAVE_SIZE.
 */
const WAVE_SIZE = 46;

/**
 * Rewires the `depend-on` edges of the combined-workflow E2E jobs so at most WAVE_SIZE jobs are
 * released at once. Non-shard prerequisites already present on a job (e.g. `build_windows`) are
 * preserved; only the `upb` fan-out edge is replaced by the wave predecessor. Returns the identifiers
 * of the final-wave "leaf" jobs so downstream jobs (aggregate_e2e_reports) can wait for the entire
 * fan-out to finish.
 */
const applyFanOutWaves = (builds: any[]): string[] => {
  builds.forEach((build, index) => {
    const predecessor = index < WAVE_SIZE ? 'upb' : builds[index - WAVE_SIZE].identifier;
    const extraDeps = (build['depend-on'] || []).filter((d: string) => d !== 'upb' && !d.startsWith('l_') && !d.startsWith('w_'));
    build['depend-on'] = extraDeps.length ? [...extraDeps, predecessor] : [predecessor];
  });

  return builds.slice(Math.max(0, builds.length - WAVE_SIZE)).map((build) => build.identifier);
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
        type: 'WINDOWS_SERVER_2022_CONTAINER',
        image: '$WINDOWS_IMAGE_2019',
      },
      'depend-on': ['build_windows', 'upb'],
    },
    join(REPO_ROOT, 'packages', 'amplify-e2e-tests'),
    false,
    undefined,
  );

  // Stagger the combined-workflow e2e fan-out into waves so the batch orchestrator is never asked to
  // release the entire fan-out at once (see applyFanOutWaves / WAVE_SIZE).
  const leafJobIdentifiers = applyFanOutWaves(splitE2ETests);

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
    'depend-on': leafJobIdentifiers,
  };
  allBuilds.push(reportsAggregator);
  let currentBatch = [...baseBuildGraph, ...allBuilds];
  configBase.batch['build-graph'] = currentBatch;
  saveConfig(configBase);

  // --- Additive split-batch generation (combined output above is left untouched) ---
  generateSplitConfigs(splitE2ETests);
}

// Prep groups that the Linux shards transitively depend on (each l_* shard depends on `upb`).
// The chain is build_linux -> publish_to_local_registry -> build_pkg_binaries_* -> upb, so this
// set is self-contained: every depend-on within it resolves to another member of the set.
const LINUX_PREP_IDENTIFIERS = [
  'build_linux',
  'publish_to_local_registry',
  'build_pkg_binaries_arm',
  'build_pkg_binaries_linux',
  'build_pkg_binaries_macos',
  'build_pkg_binaries_win',
  'upb',
];
// Windows shards depend on both `upb` and `build_windows`. `build_windows` has no dependencies of
// its own, and `upb` still depends on all four build_pkg_binaries_* jobs, so we reuse the full Linux
// prep chain and add build_windows. This keeps every depend-on resolvable within the Windows batch.
const WINDOWS_PREP_IDENTIFIERS = [...LINUX_PREP_IDENTIFIERS, 'build_windows'];

// Non-shard combined-workflow jobs that belong to the Linux batch (all LINUX_CONTAINER). These are
// NOT part of the l_* sliding-window chain — they are carried over verbatim from the combined graph
// with their original depend-on edges so the split Linux batch runs the FULL e2e suite, not just the
// l_* shards. Their dependencies resolve within the Linux batch: prep-chain jobs are in
// LINUX_PREP_IDENTIFIERS, and `cleanup_resources` depends on the Linux `aggregate_e2e_reports`.
const EXTRA_LINUX_JOB_IDENTIFIERS = [
  'build_tests_standalone',
  'test',
  'lint',
  'mock_e2e_tests',
  'validate_cdk_version',
  'verify_api_extract',
  'verify_yarn_lock',
  'verify_versions_match',
  'verify_pkg_cli',
  'integration_test',
  'amplify_sudo_install_test',
  'amplify_install_test',
  'amplify_console_integration_tests',
  'amplify_general_config_tests',
  'cleanup_resources',
];

// Index-offset sliding-window concurrency cap. CodeBuild's batch orchestrator faults materially
// above ~100 simultaneously in-progress child builds, so each batch caps its in-progress fan-out at
// W shards via a positional dependency chain: the shard at position p depends on the shard at
// position p-W, which cannot start until p-W finishes. With two separate batches each capped at 75,
// each orchestrator stays well under the ~100 fault threshold.
const SLIDING_WINDOW_SIZE = 75;
// Known-red shards (and the bundles that carry them) that are expected to fail intermittently. In a
// sliding-window chain a shard at an "early" position has a successor that depend-on's it, and a
// CodeBuild dependency only resolves on predecessor SUCCESS -- so a red early shard would skip its
// downstream successor. We pin every shard whose identifier contains one of these fragments into a
// terminal (no-successor) slot so its failure never cascades. Matched as substrings so merged-bundle
// identifiers (e.g. l_searchable_datastore_schema_searchable) are covered.
const KNOWN_RED_SHARD_FRAGMENTS = [
  'containers_api_1',
  'containers_api_2',
  'containers_api_secrets',
  'custom_policies_container',
  'schema_searchable',
  'searchable_migration',
  'searchable_datastore',
  'api_6c',
];
const isKnownRedShard = (job: any): boolean => KNOWN_RED_SHARD_FRAGMENTS.some((fragment) => String(job.identifier).includes(fragment));
// Fallback per-shard durations (minutes) for identifiers absent from the durations file.
const MEDIAN_DURATION_LINUX = 45;
const MEDIAN_DURATION_WINDOWS = 80;
const SHARD_DURATIONS_FILE = join(REPO_ROOT, '.e2e-shard-durations.json');
// Split-only shard buildspecs. These are copies of the combined-path buildspecs plus a guaranteed
// non-empty primary artifact (a marker file) so that chained depend-on successors can always resolve
// the predecessor shard's artifact, even when a shard's test run emits no coverage/report files. The
// combined-path buildspecs (run_e2e_tests_{linux,windows}.yml) are intentionally left untouched.
const SPLIT_BUILDSPEC_LINUX = 'codebuild_specs/run_e2e_tests_linux_split.yml';
const SPLIT_BUILDSPEC_WINDOWS = 'codebuild_specs/run_e2e_tests_windows_split.yml';

/**
 * Loads the per-shard wall-clock durations (minutes) keyed by shard identifier from a previous green
 * batch. Returns an empty map when the file is missing so generation still succeeds (all shards then
 * fall back to the median duration).
 */
function loadShardDurations(): Record<string, number> {
  if (!fs.existsSync(SHARD_DURATIONS_FILE)) {
    return {};
  }
  const parsed = JSON.parse(fs.readFileSync(SHARD_DURATIONS_FILE, 'utf8'));
  return parsed.shard_durations ?? {};
}

/**
 * Arranges shards into an index-offset sliding-window chain that bounds the number of simultaneously
 * in-progress builds to `windowSize`.
 *
 * Positions are 1-based. A shard at position p <= windowSize depends only on `prepDeps` (it starts as
 * soon as prep is ready). A shard at position p > windowSize depends on the shard at position
 * p-windowSize (Windows additionally keeps `build_windows`), so at most `windowSize` shards are ever
 * in-progress at once.
 *
 * Placement minimizes makespan and protects the per-build timeout: the longest shards are placed in
 * the "terminal" slots (start positions with no successor) so each runs alone start-to-finish, and
 * the remaining shards are LPT-paired (longest-early with shortest-late) so no 2-chain's summed
 * duration exceeds the longest single shard.
 *
 * Returns the reordered shards with `depend-on` rewritten, plus the projected batch makespan in
 * minutes (the longest chain sum, excluding prep).
 */
function arrangeSlidingWindow(
  shards: any[],
  windowSize: number,
  prepDeps: string[],
  medianDuration: number,
  splitBuildspec: string,
): { ordered: any[]; makespanMinutes: number } {
  const durations = loadShardDurations();
  const durationOf = (job: any): number => durations[job.identifier] ?? medianDuration;
  // Clone so we never mutate the shard objects shared with the combined-graph output, and point each
  // shard at the split-only buildspec variant that guarantees a non-empty primary artifact.
  const clones = shards.map((job) => {
    const clone = JSON.parse(JSON.stringify(job)) as any;
    clone.buildspec = splitBuildspec;
    return clone;
  });
  const n = clones.length;

  if (n <= windowSize) {
    clones.forEach((job) => {
      job['depend-on'] = [...prepDeps];
    });
    const makespanMinutes = clones.reduce((max, job) => Math.max(max, durationOf(job)), 0);
    return { ordered: clones, makespanMinutes };
  }

  const numTwoChains = n - windowSize; // start positions [1..numTwoChains] each have a successor
  const numTerminal = 2 * windowSize - n; // start positions [numTwoChains+1..windowSize] have none
  const sorted = [...clones].sort((a, b) => durationOf(b) - durationOf(a));
  const terminal = sorted.slice(0, numTerminal); // longest shards run alone in terminal slots
  const rest = sorted.slice(numTerminal); // 2 * numTwoChains shards, descending

  const early: any[] = [];
  const late: any[] = [];
  for (let i = 0; i < numTwoChains; i++) {
    early.push(rest[i]); // longer half -> early position (on prep)
    late.push(rest[rest.length - 1 - i]); // shorter half -> late position (chained to its early)
  }

  // 0-based position layout:
  //   [0 .. numTwoChains-1]          early shards          (depend on prep)
  //   [numTwoChains .. windowSize-1] terminal shards       (depend on prep, no successor)
  //   [windowSize .. n-1]            late shards            (depend on shard at index pos-windowSize)
  const ordered: any[] = [...early, ...terminal, ...late];

  // Force known-red shards out of "early" (successor-bearing) slots. A shard at index k is depended
  // on by the shard at k+windowSize, so only indices [0, numTwoChains) have a successor; indices
  // [numTwoChains, n) are terminal (no successor). Swap every red early shard with a non-red terminal
  // shard so no shard ever depends on a red one, and a red failure cannot skip a downstream shard.
  const terminalNonRedSlots: number[] = [];
  for (let k = numTwoChains; k < n; k++) {
    if (!isKnownRedShard(ordered[k])) {
      terminalNonRedSlots.push(k);
    }
  }
  for (let i = 0; i < numTwoChains; i++) {
    if (isKnownRedShard(ordered[i])) {
      const swapIdx = terminalNonRedSlots.pop();
      if (swapIdx === undefined) {
        throw new Error(
          `[split-e2e] not enough terminal (no-successor) slots to pin all known-red shards; ` +
            `increase SLIDING_WINDOW_SIZE or reduce KNOWN_RED_SHARD_FRAGMENTS`,
        );
      }
      [ordered[i], ordered[swapIdx]] = [ordered[swapIdx], ordered[i]];
    }
  }

  // Windows late shards keep build_windows in addition to their chain predecessor.
  const nonUpbPrep = prepDeps.filter((dep) => dep !== 'upb');
  ordered.forEach((job, idx) => {
    if (idx < windowSize) {
      job['depend-on'] = [...prepDeps];
    } else {
      job['depend-on'] = [...nonUpbPrep, ordered[idx - windowSize].identifier];
    }
  });

  // Makespan is the longest dependency chain (positions start, start+windowSize, ...), computed from
  // the final placement so it reflects any red-shard swaps above.
  let makespanMinutes = 0;
  for (let start = 0; start < windowSize; start++) {
    let chainMinutes = 0;
    for (let idx = start; idx < n; idx += windowSize) {
      chainMinutes += durationOf(ordered[idx]);
    }
    makespanMinutes = Math.max(makespanMinutes, chainMinutes);
  }
  return { ordered, makespanMinutes };
}

/**
 * Emits two SELF-CONTAINED batchspecs from the already-computed shard set: one Linux-only, one
 * Windows-only. Each batch carries its own copy of the prep chain (build + package + upload) so the
 * two batches can be fired independently against the same project with no cross-batch ordering.
 *
 * FUTURE OPTIMIZATION: prep is currently duplicated across both batches (~2x prep cost, though it
 * runs in parallel so there is no wall-clock penalty). Because the S3 caches are keyed by
 * $CODEBUILD_SOURCE_VERSION (project-level buckets) and both batches share the same source version,
 * the Windows batch could instead reuse the artifacts produced by the Linux batch's prep. That would
 * require running Linux prep first and gating the Windows batch on its completion — intentionally
 * omitted here to keep this first cut free of cross-batch ordering bugs.
 */
function generateSplitConfigs(splitE2ETests: any[]): void {
  // Re-read prep jobs from a clean base load so the combined graph's mutations don't leak in.
  const cleanBase: any = loadConfigBase();
  const cleanBaseGraph: any[] = cleanBase.batch['build-graph'];
  const prepJobsFor = (identifiers: string[]) => cleanBaseGraph.filter((job) => identifiers.includes(job.identifier));

  const linuxShards = splitE2ETests.filter((job) => job.identifier.startsWith('l_'));
  const windowsShards = splitE2ETests.filter((job) => job.identifier.startsWith('w_'));

  // Apply the index-offset sliding-window concurrency cap (W=75) to each batch independently. This
  // rewrites every shard's depend-on (chaining position p to position p-75) and points each shard at
  // the split-only buildspec variant.
  const linuxArranged = arrangeSlidingWindow(linuxShards, SLIDING_WINDOW_SIZE, ['upb'], MEDIAN_DURATION_LINUX, SPLIT_BUILDSPEC_LINUX);
  const windowsArranged = arrangeSlidingWindow(
    windowsShards,
    SLIDING_WINDOW_SIZE,
    ['build_windows', 'upb'],
    MEDIAN_DURATION_WINDOWS,
    SPLIT_BUILDSPEC_WINDOWS,
  );
  // eslint-disable-next-line no-console
  console.log(
    `[split-e2e] sliding-window W=${SLIDING_WINDOW_SIZE} projected makespan (excl. prep): ` +
      `linux ~${Math.round(linuxArranged.makespanMinutes)}m (${linuxArranged.ordered.length} shards), ` +
      `windows ~${Math.round(windowsArranged.makespanMinutes)}m (${windowsArranged.ordered.length} shards)`,
  );
  const linuxShardsArranged = linuxArranged.ordered;
  const windowsShardsArranged = windowsArranged.ordered;

  // Linux batch: prep chain + all l_* shards + linux aggregate.
  const linuxWaitForIds = linuxShardsArranged.map((job) => job.identifier).sort();
  fs.writeFileSync(WAIT_FOR_IDS_LINUX_FILE_PATH, `${JSON.stringify(linuxWaitForIds, null, 2)}\n`);
  const linuxAggregator = {
    identifier: 'aggregate_e2e_reports',
    env: {
      'compute-type': 'BUILD_GENERAL1_MEDIUM',
      variables: { WAIT_FOR_IDS_FILE_PATH: WAIT_FOR_IDS_LINUX_FILE_PATH },
    },
    buildspec: 'codebuild_specs/aggregate_e2e_reports.yml',
    'depend-on': ['upb'],
  };
  const linuxConfig: any = loadConfigBase();
  linuxConfig.batch['build-graph'] = [
    ...prepJobsFor(LINUX_PREP_IDENTIFIERS),
    ...prepJobsFor(EXTRA_LINUX_JOB_IDENTIFIERS),
    ...linuxShardsArranged,
    linuxAggregator,
  ];
  saveConfigToPath(linuxConfig, CODEBUILD_GENERATE_LINUX_CONFIG_PATH);

  // Windows batch: prep chain + build_windows + all w_* shards + windows aggregate.
  const windowsWaitForIds = windowsShardsArranged.map((job) => job.identifier).sort();
  fs.writeFileSync(WAIT_FOR_IDS_WINDOWS_FILE_PATH, `${JSON.stringify(windowsWaitForIds, null, 2)}\n`);
  const windowsAggregator = {
    identifier: 'aggregate_e2e_reports',
    env: {
      'compute-type': 'BUILD_GENERAL1_MEDIUM',
      variables: { WAIT_FOR_IDS_FILE_PATH: WAIT_FOR_IDS_WINDOWS_FILE_PATH },
    },
    buildspec: 'codebuild_specs/aggregate_e2e_reports.yml',
    'depend-on': ['upb'],
  };
  const windowsConfig: any = loadConfigBase();
  windowsConfig.batch['build-graph'] = [...prepJobsFor(WINDOWS_PREP_IDENTIFIERS), ...windowsShardsArranged, windowsAggregator];
  saveConfigToPath(windowsConfig, CODEBUILD_GENERATE_WINDOWS_CONFIG_PATH);
}
main();
