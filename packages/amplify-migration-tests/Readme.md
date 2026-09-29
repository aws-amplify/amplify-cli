# Amplify CLI Migration tests

This packages contains migration tests that are run in CircleCI to ensure that changes do not break an existing amplify project created with an older version of the cli

## Setup

To run the tests locally, you need to have your personal AWS credentials stored in a `.env` file of this package. These values are used to configure the test projects.

Please see sample.env for the keys that are expected in your `.env` file. Or, for internal engineers, you can copy "Copy bash/zsh" directly from your personal account, and paste it in the terminal.

The `.env` file does not get committed as its in the `.gitignore` file.

# Verbose logging

To see the CLI output set VERBOSE_LOGGING_DO_NOT_USE_IN_CI_OR_YOU_WILL_BE_FIRED=true

# Path to Amplify CLI to test migrating from installed version

In order to test migration from one CLI installation to another, the following environment variable must be set:
AMPLIFY_PATH=<your-local-installation-path>

The path can be found by executing `which amplify`.

N.B. The migration tests will install an older version of Amplify CLI via npm,
but a native installation overrides an npm installation on your PATH

## Running individual tests

Amplify Migration tests use Jest. So all the standard Jest commands work.
You can run a single test while adding a new test by running

```bash
cd <amplif-cli-root>/packages/amplify-migration-tests
yarn migration_v<VERSION>  src/__tests__/migration_tests_v<VERSION>/scaffold.test.ts
# e.g. `yarn migration_v10.5.1 src/__tests__/migration_tests_v10/scaffold.test.ts`
```

The exact command is different for some tests. See `package.json` for all of the variations of the `migration` script.

## Writing a new integration test

E2E tests internally use [nexpect](https://www.npmjs.com/package/nexpect) to run the CLI. There are helper methods that helps you to set up and delete project. The recommended pattern is to create a helper method that creates a resources as a helper method so these method could be used in other tests. For instance, `initJSProjectWithProfileV4_52_0 is a helper method that is used in `init`tests and also used in all the other tests to initialize a new Javascript project. The tests should have all the assertions to make sure the resource created by the helper method is setup correctly. We recommend using`aws-sdk` to make assert the resource configuration.

```typescript
import { initJSProjectWithProfileV4_52_0, deleteProject, amplifyPush } from '../init';
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
    await initJSProjectWithProfileV4_52_0(projRoot, { name: '<project-name>' });
    // add resources that you want to test
    await amplifyPush(projRoot); // Push it to the cloud
    const { output } = getProjectMeta(projRoot).api.simplemodel;

    // TODO - assertion to make sure the resources are pushed. Use matcher
  });
});
```
