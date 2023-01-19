/**
 * Circle CI allows you to store test results & artifacts after each job,
 * but we need to scan those results/artifacts before we upload those files.
 * 
 * You must register all paths where artifacts will be stored, using ~ as the root folder.
 * 
 * For example:
 * In config.base.yaml, we have a job 'amplify_e2e_tests_pkg' with the following steps:
 *  - run_e2e_tests:
 *    os: << parameters.os >>
 *  - scan_e2e_test_artifacts:
 *      os: << parameters.os >>
 *  - store_test_results:
 *      path: ~/repo/packages/amplify-e2e-tests/
 *  - store_artifacts:
 *      path: ~/repo/packages/amplify-e2e-tests/amplify-e2e-reports
 * 
 * From the above job, 'path' includes the following:
 *  ~/repo/packages/amplify-e2e-tests/
 *  ~/repo/packages/amplify-e2e-tests/amplify-e2e-reports
 * 
 * Those paths must be included in this list.
 * 
 * This ensures that we will scan all of these directories before uploading any files.
 * 
 * If you try to upload artifacts from a directory that is not listed below, your build 
 * will not execute, and you'll be prompted to update this list.
 * 
 * NOTE: Make sure to use '~' as the first segment in your paths, 
 * this allows for path resolution in both linux & windows machines.
 * You do not need to include pathing for Windows, as the scanning script
 * will automatically normalize these paths for Windows if it detects it.
 */
export const ARTIFACT_STORAGE_PATH_ALLOW_LIST = [
    '~/repo/packages/amplify-util-mock/',
    '~/repo/packages/graphql-transformers-e2e-tests/',
    '~/repo/packages/amplify-e2e-tests/',
    '~/repo/packages/amplify-e2e-tests/amplify-e2e-reports',
    '~/repo/packages/amplify-migration-tests/',
    '~/repo/packages/amplify-migration-tests/amplify-migration-reports',
    '~/repo/packages/amplify-console-integration-tests/',
    '~/repo/packages/amplify-console-integration-tests/console-integration-reports',
    '~/aws-amplify-cypress-auth/cypress/videos',
    '~/aws-amplify-cypress-auth/cypress/screenshots',
    '~/aws-amplify-cypress-api/cypress/videos',
    '~/aws-amplify-cypress-api/cypress/screenshots'
]