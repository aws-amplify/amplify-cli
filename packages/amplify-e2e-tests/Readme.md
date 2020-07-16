# Amplify CLI E2E tests

This packages contains end to end tests that are run in CircleCI to ensure that your changes are not breaking the CLI. Each test in this package creates resources in the cloud.

## Setup

To run the tests locally, you need to have your AWS credentials stored in a `.env` file of this package. These values are used to configure the test projects.

Please see sample.env for the keys that are expected in your `.env` file.

The `.env` file does not get commited as its in the `.gitignore` file.

## Running individual tests

Amplify E2E tests use Jest. So all the standard Jest comnmads work.
You can run a single test while adding a new test by running

```bash
cd <amplif-cli-root>/packages/amplify-e2e-tests/
npm run e2e __tests__/init.test.ts
```

## Writing a new integration test

E2E tests internally use a forked version of [nexpect](https://www.npmjs.com/package/nexpect) to run the CLI. There are helper methods that helps you to set up and delete project. The recommended pattern is to create a helper method that creates a resources as a helper method so these method could be used in other tests. For instance, `initJSProjectWithProfile` is a helper method that is used in `init` tests and also used in all the other tests to initalize a new Javascript project. The tests should have all the assertions to make sure the resource created by the helper method is setup correctly. We recommend using `aws-sdk` to make assert the resource configuration.

If you want to log the test results for debugging, set the environment variable `VERBOSE_LOGGING_DO_NOT_USE_OR_YOU_WILL_BE_FIRED` to `true` and the output from the CLI will be printed on to the screen. Please refrain (as the variable name suggest) setting this in CI as test report will have all the CLI execution logs.

```sh
env VERBOSE_LOGGING_DO_NOT_USE_OR_YOU_WILL_BE_FIRED=true yarn e2e
```

```typescript
import { initJSProjectWithProfile, deleteProject, amplifyPush } from '../init';
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
The test `init-special-case` tests a special use case when the aws config and credential files,  `~/.aws/config`  and `~/.aws/credentials`, do not exist, and the user executes the `amplify init` command on a project using command line input to provide the aws credentials. 

When the test starts, it first checks for the existence of the two files. If they exist, the test will rename them with an appendix ".hide" to file names to simulate the real execution environment. Then when the test is completed, successful or failed, the two files will be renamed back to their original names. 

There are two scenarios when this approach can cause trouble:
1. Locally running two or more test suites in parallel with this test included, the other tests might fail because test project can not be init'ed when the above mentioned config and credential files are missing.
2. In the middle of execution, the test is interrupted by Ctrl+C, then the hidden config and credential files are not renamed back. 

So, You should NOT run multiple tests in parallel locally with the `init-special-case` test included. And, if you use Ctrl+C to interrupt the `init-special-case` test, you need to go to the `~/.aws/c` folder and rename the config and credential files to their original names. 
