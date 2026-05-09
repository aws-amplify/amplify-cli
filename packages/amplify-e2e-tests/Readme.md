# Amplify CLI E2E tests

This packages contains end to end tests that are run in CircleCI to ensure that your changes are not breaking the CLI. Each test in this package creates resources in the cloud.

## Setup

To run the tests locally, you need to have your personal AWS credentials stored in a `.env` file of this package. These values are used to configure the test projects.

Please see sample.env for the keys that are expected in your `.env` file. Or, for internal engineers, you can copy "Copy bash/zsh" directly from your personal account, and paste it in the terminal.

The `.env` file does not get committed as its in the `.gitignore` file.

Set `AMPLIFY_PATH` to point to `amplify-cli/bin/amplify` or using absolute path `<PATH_TO_ROOT>/packages/amplify-cli/bin/amplify`

## Running individual tests

Amplify E2E tests use Jest. So all the standard Jest commands work.
You can run a single test while adding a new test by running

```bash
cd <amplif-cli-root>/packages/amplify-e2e-tests/
yarn e2e src/__tests__/init_a.test.ts
```

## Writing a new integration test

E2E tests internally use a forked version of [nexpect](https://www.npmjs.com/package/nexpect) to run the CLI. There are helper methods that helps you to set up and delete project. The recommended pattern is to create a helper method that creates a resources as a helper method so these method could be used in other tests. For instance, `initJSProjectWithProfile` is a helper method that is used in `init` tests and also used in all the other tests to initialize a new Javascript project. The tests should have all the assertions to make sure the resource created by the helper method is setup correctly. We recommend using `aws-sdk` to make assert the resource configuration.

To configure the amount of time nexpect will wait for CLI responses, you can set the `AMPLIFY_TEST_TIMEOUT_SEC` environment variable. It is helpful to set this to a low value (10 seconds or so) when writing new tests so that you don't spend unnecessary time waiting for nexpect to error out on a misconfigured wait() block

If you want to log the test results for debugging, set the environment variable `VERBOSE_LOGGING_DO_NOT_USE_IN_CI_OR_YOU_WILL_BE_FIRED` to `true` and output logs will be written to temp files. The temp file paths will be printed as the tests run and you can `cat` or `tail` the logs to see the CLI output

```sh
env VERBOSE_LOGGING_DO_NOT_USE_IN_CI_OR_YOU_WILL_BE_FIRED=true yarn e2e
```

```typescript
import { amplifyPush, deleteProject, initJSProjectWithProfile } from '../init';
import { createNewProjectDir, deleteProjectDir, getProjectMeta } from '../utils';

describe('amplify your test', () => {
  let projRoot: string;
  beforeEach(() => {
    projRoot = createNewProjectDir(); // create a new project for each test
    jest.setTimeout(1000 * 60 * 60); // 1 hour timeout as pushing might be slow
  });

  afterEach(async () => {
    await deleteProject(projRoot); // delete the project from the cloud
    deleteProjectDir(projRoot); // delete the project directory
  });

  it('<your test>', async () => {
    await initJSProjectWithProfile(projRoot, { name: '<project-name>' });
    // add resources that you want to test
    await amplifyPush(projRoot); // Push it to the cloud
    const { output } = getProjectMeta(projRoot).api.simplemodel;

    // TODO - assertion to make sure the resources are pushed. Use matcher
  });
});
```

## Warning on running init-special-case test locally

The test `init-special-case` tests a special use case when the aws config and credential files, `~/.aws/config` and `~/.aws/credentials`, do not exist, and the user executes the `amplify init` command on a project using command line input to provide the aws credentials.

When the test starts, it first checks for the existence of the two files. If they exist, the test will rename them with an appendix ".hide" to file names to simulate the real execution environment. Then when the test is completed, successful or failed, the two files will be renamed back to their original names.

There are two scenarios when this approach can cause trouble:

1. Locally running two or more test suites in parallel with this test included, the other tests might fail because test project can not be init'ed when the above mentioned config and credential files are missing.
2. In the middle of execution, the test is interrupted by Ctrl+C, then the hidden config and credential files are not renamed back.

So, You should NOT run multiple tests in parallel locally with the `init-special-case` test included. And, if you use Ctrl+C to interrupt the `init-special-case` test, you need to go to the `~/.aws/c` folder and rename the config and credential files to their original names.

## Gen2 Migration E2E Tests

The tests under `src/__tests__/gen2-migration/` exercise the full Gen1-to-Gen2 migration workflow for each sample app. They delegate entirely to the `@aws-amplify/amplify-e2e-gen2-migration` package — each test file simply calls `runMigrationE2E('<app-name>')` which constructs an `App` instance and runs the complete lifecycle in-process.

Each test passes `teardown: true`, so all deployed resources (Gen1 stacks, Gen2 sandbox stacks, Amplify apps) are cleaned up automatically at the end of the run, regardless of success or failure.

### Duration

These tests are long — typically around two hours per app. Each test runs the full migration end-to-end (deploy Gen1, generate, sandbox, refactor) and then rolls back and re-migrates forward to verify rollback safety. This effectively exercises the entire workflow twice. Most of the wall-clock time is spent waiting on CloudFormation stack operations.

### Retries

The standard `retry` function in `local_publish_helpers_codebuild.sh` (which retries a test command up to 2 times) does not work for these tests. A single run can exceed one hour, and by the time the retry starts, the AWS session token obtained at the beginning has expired. The tests themselves handle credential refresh internally via `CredentialManager`, but that only works within a single continuous execution — a fresh retry starts from scratch with stale credentials.

Retries must be done externally via CodeBuild. When a test fails, the entire CodeBuild build is retried from the beginning, which obtains fresh credentials and starts a clean run.

### Known Flaky Test

The `mood-board` test is flaky due to a race condition in its Kinesis-backed frontend test (write/read timing). If it fails, retry the test — the underlying migration logic is correct.
