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

* To run the tests locally, you need to have your both Amplify CLI and AWS CLI configured and make sure `amplify` and `aws` are in bash environment.
* Create a `test.json` file under root folder **only if you want to test JavaScript SDK integration tests**. A template for the json file is provided as following.
```json
{
    "gitRepo":"MY_SAMPLE_APP_REPO",
    "CATEGORY_NAME_#1": {
        "port": "SERVER_LAUNCHING_PORT_UNDER_THIS_CATEGORY",
        "SUB_CATEGORY_NAME_#1": {
            "apps":[
                {
                    "name": "APP_NAME_#1"
                    "path": "RELATIVE_PATH_IN_SAMPLE_APP_REPO_#1"
                    "testFiles":"CYPRESS_TEST_FILES_#1"
                },
                {
                    "name": "APP_NAME_#2"
                    "path": "RELATIVE_PATH_IN_SAMPLE_APP_REPO_#2"
                    "testFiles":"CYPRESS_TEST_FILES_#2"
                }
            ]
        }
    }
}
```
**Definations for parameters**
* `gitRepo`: It is sample app Github repo. This is a mandatory parameter. You should have the access to clone the repo.
* 'CATEGORY_NAME`: This is a literal name. It is a general classification name for amplify categories. Each category has a corresponding `.test.js` file under `__test__/` folder. All the tests files are running in parallel based on general categories.
* `port`: The server launching port under each category. This is a mandatory parameter and used for running tests in parallel. 
* `SUB_CATEGORY_NAME`: This is a literal name. This is a detailed classification within the general category. You can have multiple sub categories under one general category. They share the same port number inherited from general port and run in order. Besides, the apps under the one sub category share the same `aws-exports.js` file.
* `apps`: The list of apps you want to test under each sub categories.
* `name`: The literal name for the app. It is a required parameter.
* `path`: The relative path to the app root in sample app repo. It is a required parameter.
* `testFiles`: A regex expression for the Cypress test files. By default Cypress will look up files under `cypress/integration` folder. It is a required parameter.

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

To run the JS UI tests locally, you can run `npm run ui js/[category]` for each category or run `npm run ui` for all categories. The tests are run in parallel so that it will save a lot of time in CircleCI.

## How to write your own integation tests for JS SDK
```javascript
describe('[Category] tests in JavaScript SDK', () => {

    //TODO: get configuration for [Category]
    
    describe('[Sub-category-#1] test:', () => {

        //TODO: get configuration for [Sub-category]

        beforeAll(() => {
            //TODO: create a folder for sub-category
        });

        afterAll(() => {
            //TODO: tear down all aws resources
        })
        
        it('should set up amplify backend and generate aws-exports.js file', () => {
            //TODO: add your aws provision method here
        });
        
        describe('Run UI tests on JS app', () => {
            afterEach(() => {
                closeServer();
            })
            apps.forEach((app) => {
                it('should pass all UI tests on app ${app.name}', () => {
                    //TODO: add your test steps
                    createTestMetaFile();
                    copyAWSExportsFileToProj();
                    buildApp();
                    startSever();
                    runCypressTest()
                });
            });
        });
    });

    describe('[Sub-category-#2] test:', () => {
        //TODO: follow the same pattern mentioned above
    });
});
```
A code pattern is presented above to write your own integration tests on new category or sub-category. Follow the instructions below:

1. Determine the sample app you want to add.
2. Determine the category and sub category for your test.
3. Add new resource provision functions if necessary.
4. Refer to the code pattern above and make code changes.
5. Update the test.json based on the tests you add.
