# Amplify CLI Migration tests

This packages contains migration tests that are run in CircleCI to ensure that changes do not break an existing amplify project created with an older version of the cli

## Setup

To run the tests locally, you need to have your AWS credentials stored in a `.env` file of this package. These values are used to configure the test projects.

Please see sample.env for the keys that are expected in your `.env` file.

The `.env` file does not get commited as its in the `.gitignore` file.

## Running individual tests

Amplify Migration tests use Jest. So all the standard Jest comnmads work.
You can run a single test while adding a new test by running

```bash
cd <amplif-cli-root>/packages/amplify-e2e-tests/
npm run e2e __tests__/init.test.ts
```

## Writing a new integration test

E2E tests internally use [nexpect](https://www.npmjs.com/package/nexpect) to run the CLI. There are helper methods that helps you to set up and delete project. The recommended pattern is to create a helper method that creates a resources as a helper method so these method could be used in other tests. For instance, `initJSProjectWithProfile` is a helper method that is used in `init` tests and also used in all the other tests to initalize a new Javascript project. The tests should have all the assertions to make sure the resource created by the helper method is setup correctly. We recommend using `aws-sdk` to make assert the resource configuration.

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
