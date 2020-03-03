# Amplify Console integration tests

This packages contains integration tests that are run in CircleCI to ensure that your changes are not breaking the Amplify Console.

## Setup

To run the tests locally, you need to have your AWS credentials stored in a `.env` file of this package. These values are used to configure the test projects.

Please see sample.env for the keys that are expected in your `.env` file.

The `.env` file does not get commited as its in the `.gitignore` file.

## Running individual tests

Amplify Console E2E tests use Jest. So all the standard Jest comnmads work.
You can run a single test while adding a new test by running

```bash
cd <amplif-cli-root>/packages/amplify-console-integration/
npm run <test-file-name>
```