import { $TSAny } from 'amplify-cli-core';
export declare function getSchemaPath(schemaName: string): string;
export declare function apiGqlCompile(cwd: string, testingWithLatestCodebase?: boolean): Promise<void>;
export interface AddApiOptions {
    apiName: string;
    testingWithLatestCodebase: boolean;
    transformerVersion: number;
}
export declare const defaultOptions: AddApiOptions;
export declare function addApiWithoutSchema(cwd: string, opts?: Partial<AddApiOptions & {
    apiKeyExpirationDays: number;
}>): Promise<void>;
export declare function addApiWithOneModel(cwd: string, opts?: Partial<AddApiOptions & {
    apiKeyExpirationDays: number;
}>): Promise<void>;
export declare function addApiWithThreeModels(cwd: string, opts?: Partial<AddApiOptions & {
    apiKeyExpirationDays: number;
}>): Promise<void>;
export declare function addApiWithBlankSchema(cwd: string, opts?: Partial<AddApiOptions & {
    apiKeyExpirationDays: number;
}>): Promise<void>;
export declare function addApiWithBlankSchemaAndConflictDetection(cwd: string, opts?: Partial<AddApiOptions & {
    apiKeyExpirationDays: number;
}>): Promise<void>;
/**
 * Note: Lambda Authorizer is enabled only for Transformer V2
 */
export declare function addApiWithAllAuthModes(cwd: string, opts?: Partial<AddApiOptions & {
    apiKeyExpirationDays: number;
}>): Promise<void>;
export declare function updateApiSchema(cwd: string, projectName: string, schemaName: string, forceUpdate?: boolean): void;
export declare function updateApiWithMultiAuth(cwd: string, settings?: {
    testingWithLatestCodebase?: boolean;
    doMigrate?: boolean;
}): Promise<void>;
export declare function apiEnableDataStore(cwd: string, settings: any): Promise<void>;
export declare function apiDisableDataStore(cwd: string, settings: any): Promise<void>;
export declare function updateAPIWithResolutionStrategyWithoutModels(cwd: string, settings: any): Promise<void>;
export declare function updateAPIWithResolutionStrategyWithModels(cwd: string, settings: any): Promise<void>;
export type RestAPISettings = {
    path?: string;
    isFirstRestApi?: boolean;
    existingLambda?: boolean;
    restrictAccess?: boolean;
    allowGuestUsers?: boolean;
    projectContainsFunctions?: boolean;
    apiName?: string;
    hasUserPoolGroups?: boolean;
    isCrud?: boolean;
};
export declare function addRestApi(cwd: string, settings: RestAPISettings): Promise<void>;
declare const updateRestApiDefaultSettings: {
    updateOperation: "Add another path" | "Update path" | "Remove path";
    expectMigration: boolean;
    newPath: string;
    testingWithLatestCodebase: boolean;
};
export declare function updateRestApi(cwd: string, settings?: Partial<typeof updateRestApiDefaultSettings>): Promise<void>;
export declare function addApi(projectDir: string, authTypesConfig?: Record<string, $TSAny>, requireAuthSetup?: boolean): Promise<void>;
export declare function addApiWithCognitoUserPoolAuthTypeWhenAuthExists(projectDir: string, opts?: Partial<AddApiOptions & {
    apiKeyExpirationDays: number;
}>): Promise<void>;
export declare function addRestContainerApi(projectDir: string, opts?: Partial<AddApiOptions & {
    apiKeyExpirationDays: number;
}>): Promise<void>;
export declare function rebuildApi(projDir: string, apiName: string): Promise<void>;
export declare function addRestContainerApiForCustomPolicies(projectDir: string, settings: {
    name: string;
}): Promise<void>;
export declare function modifyRestAPI(projectDir: string, apiName: string): void;
export declare function cancelAmplifyMockApi(cwd: string): Promise<void>;
export declare function validateRestApiMeta(projRoot: string, meta?: any): Promise<void>;
export {};
