/**
 * Data structure defined for Layer Push
 */
export type LayerPushSettings = {
    acceptSuggestedLayerVersionConfigurations?: boolean;
    layerDescription?: string;
    migrateLegacyLayer?: boolean;
    usePreviousPermissions?: boolean;
};
export type PushOpts = {
    minify?: boolean;
};
/**
 * Function to test amplify push with verbose status
 */
export declare const amplifyPush: (cwd: string, testingWithLatestCodebase?: boolean, opts?: PushOpts) => Promise<void>;
/**
 * Function to test amplify push with verbose status
 */
export declare const amplifyPushLegacy: (cwd: string) => Promise<void>;
/**
 * Function to test amplify push with codegen for graphql API
 */
export declare const amplifyPushGraphQlWithCognitoPrompt: (cwd: string, testingWithLatestCodebase?: boolean) => Promise<void>;
/**
 * Function to test amplify push with force push flag --force
 */
export declare const amplifyPushForce: (cwd: string, testingWithLatestCodebase?: boolean) => Promise<void>;
/**
 * * Used to stop an iterative deployment
 * * Waits on the table stack to be complete and for the next stack to update in order to cancel the push
 */
export declare function cancelIterativeAmplifyPush(cwd: string, idx: {
    current: number;
    max: number;
}, testingWithLatestCodebase?: boolean): Promise<void>;
/**
 * Function to test amplify push without codegen prompt
 */
export declare const amplifyPushWithoutCodegen: (cwd: string, testingWithLatestCodebase?: boolean, allowDestructiveUpdates?: boolean) => Promise<void>;
/**
 * Function to test amplify push with function secrets without codegen prompt
 */
export declare function amplifyPushSecretsWithoutCodegen(cwd: string, testingWithLatestCodebase?: boolean): Promise<void>;
/**
 * Function to test amplify push with allowDestructiveUpdates flag option
 */
export declare function amplifyPushUpdate(cwd: string, waitForText?: RegExp, testingWithLatestCodebase?: boolean, allowDestructiveUpdates?: boolean, overridePushTimeoutMS?: number, minify?: any): Promise<void>;
/**
 * Function to test amplify push with allowDestructiveUpdates flag option
 */
export declare function amplifyPushUpdateLegacy(cwd: string, waitForText?: RegExp, allowDestructiveUpdates?: boolean, overridePushTimeoutMS?: number): Promise<void>;
/**
 * Function to test amplify push
 */
export declare const amplifyPushAuth: (cwd: string, testingWithLatestCodebase?: boolean) => Promise<void>;
/**
 * Function to test amplify push
 */
export declare const amplifyPushAuthV10: (cwd: string, testingWithLatestCodebase?: boolean) => Promise<void>;
/**
 * To be used in migrations tests only
 */
export declare const amplifyPushAuthV5V6: (cwd: string) => Promise<void>;
/**
 * amplify push command for pushing functions
 * @param cwd : current working directory
 * @param testingWithLatestCode : boolean flag
 * @returns void
 */
export declare const amplifyPushFunction: (cwd: string, testingWithLatestCode?: boolean) => Promise<void>;
/**
 * Function to test amplify push with allowDestructiveUpdates flag and when dependent function is removed from schema.graphql
 */
export declare function amplifyPushUpdateForDependentModel(cwd: string, testingWithLatestCodebase?: boolean, allowDestructiveUpdates?: boolean): Promise<void>;
/**
 * Function to test amplify push when deploying a layer
 * * this function expects a single layer's content to be modified
 */
export declare const amplifyPushLayer: (cwd: string, settings: LayerPushSettings, testingWithLatestCodebase?: boolean) => Promise<void>;
/**
 * Function to test amplify push with iterativeRollback flag option
 */
export declare const amplifyPushIterativeRollback: (cwd: string, testingWithLatestCodebase?: boolean) => Promise<void>;
/**
 * Function to test amplify push with missing environment variable
 */
export declare const amplifyPushMissingEnvVar: (cwd: string, newEnvVarValue: string) => Promise<void>;
/**
 * Function to test amplify push with missing function secrets
 */
export declare const amplifyPushMissingFuncSecret: (cwd: string, newSecretValue: string) => Promise<void>;
/**
 * Function to test amplify push with no changes in the resources
 */
export declare const amplifyPushWithNoChanges: (cwd: string, testingWithLatestCodebase?: boolean) => Promise<void>;
/**
 * Function to test amplify push with destructive updates on the API models
 */
export declare const amplifyPushDestructiveApiUpdate: (cwd: string, includeForce: boolean) => Promise<void>;
/**
 * Function to test amplify push with overrides functionality
 */
export declare const amplifyPushOverride: (cwd: string, testingWithLatestCodebase?: boolean) => Promise<void>;
