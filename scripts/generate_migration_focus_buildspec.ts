// Focused e2e buildspec: only the 6 transformer-migration tests, Linux, one job each.
// Self-contained: does NOT import split-e2e-tests-codebuild.ts (its module-load path calls a
// glob API that is broken under the current lockfile). Inlines the two tiny helpers instead.
import { join } from 'path';
import * as fs from 'fs-extra';
import * as yaml from 'js-yaml';

const REPO_ROOT = join(__dirname, '..');
const BASE_PATH = join(REPO_ROOT, 'codebuild_specs', 'e2e_workflow_base.yml');
const OUT_PATH = join(REPO_ROOT, 'codebuild_specs', 'e2e_migration_focus_generated.yml');

const TESTS = [
  'src/__tests__/transformer-migrations/function-migration.test.ts',
  'src/__tests__/transformer-migrations/auth-migration.test.ts',
  'src/__tests__/transformer-migrations/http-migration.test.ts',
  'src/__tests__/transformer-migrations/model-migration.test.ts',
  'src/__tests__/transformer-migrations/predictions-migration.test.ts',
  'src/__tests__/transformer-migrations/searchable-migration.test.ts',
];
const REGION = 'us-east-1';

const necessaryIds = [
  'build_linux',
  'publish_to_local_registry',
  'build_pkg_binaries_arm',
  'build_pkg_binaries_linux',
  'build_pkg_binaries_macos',
  'build_pkg_binaries_win',
  'upb',
];

const main = () => {
  for (const t of TESTS) {
    if (!fs.existsSync(join(REPO_ROOT, 'packages', 'amplify-e2e-tests', t))) {
      throw new Error(`Test path not found: ${t}`);
    }
  }
  const configBase: any = yaml.load(fs.readFileSync(BASE_PATH, 'utf8'));
  const baseBuildGraph = configBase.batch['build-graph'].filter((i: any) => necessaryIds.includes(i.identifier));
  const jobs = TESTS.map((filePath) => ({
    identifier:
      'l_' +
      filePath
        .replace(/src\/__tests__\//g, '')
        .replace(/\.test/g, '')
        .replace(/\.ts/g, '')
        .replace(/\./g, '_')
        .replace(/-/g, '_')
        .replace(/\//g, '_'),
    buildspec: 'codebuild_specs/run_e2e_tests_linux.yml',
    env: { variables: { TEST_SUITE: filePath, CLI_REGION: REGION } },
    'depend-on': ['upb'],
  }));
  configBase.batch['build-graph'] = [...baseBuildGraph, ...jobs];
  const output = ['# auto generated file. DO NOT EDIT manually', yaml.dump(configBase, { noRefs: true, lineWidth: -1 })];
  fs.writeFileSync(OUT_PATH, output.join('\n'));
  console.log('Generated focused buildspec at', OUT_PATH);
  console.log('Jobs:', jobs.map((j) => j.identifier).join(', '));
};

main();
