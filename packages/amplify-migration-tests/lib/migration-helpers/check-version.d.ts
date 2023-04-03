export declare function versionCheck(cwd: string, testingWithLatestCodebase?: boolean, version?: {
    v?: string;
}): Promise<void>;
/**
 * Validates from and to versions for migration tests.
 */
export declare const validateVersionsForMigrationTest: () => Promise<void>;
/**
 * This list is used to check migration tests with the following changes. (excludes layer migration tests)
 *
 * api add/update flow: https://github.com/aws-amplify/amplify-cli/pull/8287
 *
 * ext migrate flow: https://github.com/aws-amplify/amplify-cli/pull/8806
 */
export declare const allowedVersionsToMigrateFrom: string[];
