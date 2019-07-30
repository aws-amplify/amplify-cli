# Amplify CLI UI tests

This packages contains scripts to automatically provision AWS resources by running Amplify CLI and run JS UI tests in CircleCI, which ensure that your changes are not breaking CLI. The backend provision scripts support all the SDKs including iOS, Android and JavaScript.

## Prerequisite
* NodeJS
* AWS-CLI(required for the testing user sign-up)

## Setup
Before running the scripts, you need to do the installation by the following steps:
* Clone this repo. Run `npm run setup-dev` under the repo root.
* Then `cd packages/amplify-ui-tests` to make sure you are under this package.

## Configuration
To run the tests locally, you need to have your AWS credentials stored in a `.env` file of this package. These values are used to configure the tests projects.

To be more specific, you need two variables in `.env`, which are `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`.

The `.env` file does not get commited as its in `.gitignore` file.

## How to run the AWS resources provision scripts

* Run `npm run config [your-project-root] [sdk] [list: categories]`. `[sdk]` includes `js`, `ios` and `android`. `[list: categories]` includes `auth`, `storage` and `api`
* Before you run adding api for your cloud, paste your own graphql schema file under `./schemas`, change the file name to `simple_model.graphql`
* When you finish testing and want to tear down the cloud resources, run `npm run delete [your-project-root]` to get all resources deleted.

**Notes**:

* If your project root is not an typical JS/iOS/Android app or it is an empty folder, only `js` for `[sdk]` will run successfully in this case.
* When adding categories, you cannot add `storage` or `api` alone, which both needs `auth` as a prerequisite. 
* This is a one-time running script, which means your should include all the categories to be added at the first run. 
* Make sure you don't have any amplify resources in your app. The `config` script will not succeed unless you first delete all the amplify resources in your apps.

## How to run JavaScript UI test scripts
The UI tests scripts for JS SDK are included in this package. The test scripts are written by using JEST framework. All the three categories are in the package. For each category test, the JEST script will do the following things:

* Git clone the JS sample app.
* Provision AWS resources required for the app.
* Sign up a pre-defined user for the test.
* Build and start the server for sample app.
* Launch the Cypress tests.
* Tear down all the resources after the test.

When the tests are running in CircleCI, the videos and screenshots are recorded for all the tests, and will be uploaded to artifact section. Screenshots are only recorded when the tests fail.

To run the JS UI tests locally, you can run `npm run ui js/[category]` for each category or run `npm run ui js` for all categories. The tests are run in parallel so that it will save a lot of time in CircleCI.