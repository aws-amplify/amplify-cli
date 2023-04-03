export type AddStorageSettings = {
    resourceName?: string;
    bucketName?: string;
};
export type AddDynamoDBSettings = {
    resourceName: string;
    tableName: string;
    gsiName: string;
};
export declare function addSimpleDDB(cwd: string, settings: any): Promise<void>;
export declare function addDDBWithTrigger(cwd: string, settings: {
    ddbResourceName?: string;
}): Promise<void>;
export declare function updateDDBWithTrigger(cwd: string, settings: any): Promise<void>;
export declare function updateDDBWithTriggerMigration(cwd: string, settings: any): Promise<void>;
export declare function updateSimpleDDBwithGSI(cwd: string): Promise<void>;
export declare function addSimpleDDBwithGSI(cwd: string): Promise<void>;
export declare function overrideDDB(cwd: string): Promise<unknown>;
export declare function buildOverrideStorage(cwd: string): Promise<unknown>;
export declare function addDynamoDBWithGSIWithSettings(projectDir: string, settings: AddDynamoDBSettings): Promise<void>;
export declare function addS3(cwd: string): Promise<void>;
export declare function addS3AndAuthWithAuthOnlyAccess(cwd: string): Promise<void>;
export declare function addS3WithGuestAccess(cwd: string): Promise<void>;
export declare function addS3WithGroupAccess(cwd: string, settings: any): Promise<void>;
export declare function addS3WithTrigger(cwd: string): Promise<void>;
export declare function updateS3AddTrigger(cwd: string): Promise<void>;
export declare function updateS3AddTriggerWithAuthOnlyReqMigration(cwd: string, settings: any): Promise<void>;
export declare function updateS3AddTriggerNewFunctionWithFunctionExisting(cwd: string, settings: any): Promise<void>;
export declare function addS3StorageWithIdpAuth(projectDir: string): Promise<void>;
export declare function addS3Storage(projectDir: string): Promise<void>;
export declare function addS3StorageWithAuthOnly(projectDir: string): Promise<void>;
export declare function overrideS3(cwd: string): Promise<unknown>;
export declare function addS3StorageWithSettings(projectDir: string, settings: AddStorageSettings): Promise<void>;
