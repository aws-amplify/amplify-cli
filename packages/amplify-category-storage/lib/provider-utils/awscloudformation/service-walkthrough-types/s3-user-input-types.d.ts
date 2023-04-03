export declare function enumToHelp(obj: object): string;
export declare enum S3TriggerFunctionType {
    EXISTING_FUNCTION = "Choose an existing function from the project",
    NEW_FUNCTION = "Create a new function"
}
export declare enum S3UserAccessRole {
    AUTH = "Auth",
    GUEST = "Guest",
    GROUP = "Group"
}
export declare function getUserAccessQuestions(accessRole: S3UserAccessRole): string;
export declare enum S3AccessType {
    AUTH_AND_GUEST = "authAndGuest",
    AUTH_ONLY = "auth"
}
export declare enum S3PermissionType {
    CREATE_AND_UPDATE = "CREATE_AND_UPDATE",
    READ = "READ",
    DELETE = "DELETE"
}
export declare enum S3TriggerEventType {
    OBJ_PUT_POST_COPY = "s3:ObjectCreated:*",
    OBJ_REMOVED = "s3:ObjectRemoved:*"
}
export type GroupAccessType = Record<string, S3PermissionType[]>;
export declare enum S3TriggerPrefixTransform {
    NONE = "NONE",
    ATTACH_REGION = "ATTACH_REGION"
}
export interface S3TriggerPrefixType {
    prefix: string;
    prefixTransform: S3TriggerPrefixTransform;
}
export interface S3UserInputTriggerFunctionParams {
    category: string;
    tag?: string;
    triggerFunction: string;
    permissions: S3PermissionType[];
    triggerEvents: S3TriggerEventType[];
    triggerPrefix?: S3TriggerPrefixType[];
}
export interface S3UserInputs {
    resourceName: string | undefined;
    bucketName: string | undefined;
    policyUUID: string | undefined;
    storageAccess: S3AccessType | undefined;
    guestAccess: S3PermissionType[];
    authAccess: S3PermissionType[];
    triggerFunction?: string | undefined;
    adminTriggerFunction?: S3UserInputTriggerFunctionParams | undefined;
    additionalTriggerFunctions?: S3UserInputTriggerFunctionParams[] | undefined;
    groupAccess?: GroupAccessType | undefined;
}
export declare function defaultS3UserInputs(): S3UserInputs;
export declare function getRoleAccessDefaultValues(role: string, groupName: string | undefined, userInputs: S3UserInputs): S3PermissionType[];
//# sourceMappingURL=s3-user-input-types.d.ts.map