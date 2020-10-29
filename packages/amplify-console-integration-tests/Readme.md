# Amplify Console integration tests

This packages contains integration tests that are run in CircleCI to ensure that your changes are not breaking the Amplify Console.

## Setup

To run the tests locally, you need to have your AWS credentials stored in a `.env` file of this package. These values are used to configure the test projects.

Please see sample.env for the keys that are expected in your `.env` file.

The `.env` file does not get commited as its in the `.gitignore` file.

## Running individual tests

Amplify Console integration tests use Jest. So all the standard Jest commands work.

You must first setup the test profile before you can run individual tests

```bash
cd <amplif-cli-root>/packages/amplify-console-integration-tests/
npm run setup-profile
```

You can run a single test by running

```bash
cd <amplif-cli-root>/packages/amplify-console-integration-tests/
jest <test-name>
```
