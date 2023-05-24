import * as execa from 'execa';
import { join } from 'path';
import { ARTIFACT_STORAGE_PATH_ALLOW_LIST } from './artifact-storage-path-allow-list';
import { CircleCIConfig } from './cci-types';
import { loadConfig, REPO_ROOT, saveConfig } from './cci-utils';
import { migrationFromV10Tests, migrationFromV8Tests } from './split-e2e-test-filters';
import { splitTestsV2 } from './split-e2e-tests-v2';

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
  const cci_config_path = join(REPO_ROOT, '.circleci', 'config.yml');
  const cci_generated_config_path = join(REPO_ROOT, '.circleci', 'generated_config.yml');
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
  for (let key of Object.keys(config.jobs)) {
    const job = config.jobs[key];
    const steps = job.steps;

    for (let i = 0; i < steps.length; i++) {
      const resultsPath = steps[i].store_test_results;
      const artifactsPath = steps[i].store_artifacts;
      if (resultsPath) {
        storagePathsUsedInConfig.add(resultsPath.path);
        if (ARTIFACT_STORAGE_PATH_ALLOW_LIST.indexOf(resultsPath.path) === -1) {
          unregisteredPaths.add(resultsPath.path);
        }
        if (!resultsPath.path.startsWith('~/')) {
          invalidPaths.add(resultsPath.path);
        }
      }
      if (artifactsPath) {
        storagePathsUsedInConfig.add(artifactsPath.path);
        if (ARTIFACT_STORAGE_PATH_ALLOW_LIST.indexOf(artifactsPath.path) === -1) {
          unregisteredPaths.add(artifactsPath.path);
        }
        if (!artifactsPath.path.startsWith('~/')) {
          invalidPaths.add(artifactsPath.path);
        }
      }
    }
  }
  if (unregisteredPaths.size > 0 || invalidPaths.size > 0) {
    console.log('There are errors in your configuration.\n');

    if (invalidPaths.size > 0) {
      const errors = Array.from(invalidPaths);
      console.log('Fix these paths. They must start with ~/', errors, '\n');
    }
    if (unregisteredPaths.size > 0) {
      const newList = Array.from(storagePathsUsedInConfig);
      const unregisteredList = Array.from(unregisteredPaths);
      console.log('You are storing artifacts in an unregistered location.');
      console.log('Please update artifact-storage-path-allow-list.ts to include the new storage paths.');
      console.log('Update the list to match this:', newList);
      console.log('Doing so will register these unregistered paths:', unregisteredList);
    }
    process.exit(1);
  }
}

function main(): void {
  const config = loadConfig();

  validateArtifactStoragePaths(config);

  const counts = { w: 0, l: 0 };
  const splitPkgTests = splitTestsV2(
    config,
    counts,
    'amplify_e2e_tests_pkg',
    'build_test_deploy_v3',
    join(REPO_ROOT, 'packages', 'amplify-e2e-tests'),
    false,
    undefined,
  );
  const splitV8MigrationTests = splitTestsV2(
    splitPkgTests,
    counts,
    'amplify_migration_tests_v8',
    'build_test_deploy_v3',
    join(REPO_ROOT, 'packages', 'amplify-migration-tests'),
    true,
    (tests: string[]) => {
      return tests.filter((testName) => migrationFromV8Tests.find((t) => t === testName));
    },
  );
  const splitV10MigrationTests = splitTestsV2(
    splitV8MigrationTests,
    counts,
    'amplify_migration_tests_v10',
    'build_test_deploy_v3',
    join(REPO_ROOT, 'packages', 'amplify-migration-tests'),
    true,
    (tests: string[]) => {
      return tests.filter((testName) => migrationFromV10Tests.find((t) => t === testName));
    },
  );
  console.log(counts);
  saveConfig(splitV10MigrationTests);
  verifyConfig();
}
main();
