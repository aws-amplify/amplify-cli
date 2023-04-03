import { $TSAny, $TSContext, $TSObject } from 'amplify-cli-core';
import { GroupAccessType, S3PermissionType, S3TriggerEventType, S3TriggerPrefixType, S3UserInputs, S3UserInputTriggerFunctionParams } from '../service-walkthrough-types/s3-user-input-types';
export interface MigrationParams {
    parametersFilepath: string;
    cfnFilepath: string;
    storageParamsFilepath: string;
    parameters: $TSObject;
    cfn: $TSObject;
    storageParams: $TSObject;
}
export declare enum S3CFNPermissionType {
    CREATE = "s3:PutObject",
    READ = "s3:GetObject",
    DELETE = "s3:DeleteObject",
    LIST = "s3:ListBucket"
}
export declare enum S3StorageParamsPermissionType {
    CREATE_AND_UPDATE = "create/update",
    READ = "read",
    DELETE = "delete"
}
export interface S3CFNPermissionMapType {
    [S3StorageParamsPermissionType.CREATE_AND_UPDATE]: S3CFNPermissionType[];
    [S3StorageParamsPermissionType.READ]: S3CFNPermissionType[];
    [S3StorageParamsPermissionType.DELETE]: S3CFNPermissionType[];
}
interface IObjectS3PermissionType {
    [key: string]: S3PermissionType[];
}
export interface S3PermissionMapType extends IObjectS3PermissionType {
    'create/update': S3PermissionType[];
    read: S3PermissionType[];
    delete: S3PermissionType[];
}
export type S3CFNDependsOn = {
    category: string;
    resourceName: string;
    attributes: string[];
};
export type GroupCFNAccessType = Record<string, S3CFNPermissionType[]>;
export type GroupStorageParamsAccessType = Record<string, S3StorageParamsPermissionType[]>;
export type S3FeatureMetadata = {
    dependsOn: S3CFNDependsOn[];
};
export type S3InputStateOptions = {
    resourceName: string;
    inputPayload?: S3UserInputs;
    metadata?: S3FeatureMetadata;
};
export declare function canResourceBeTransformed(context: $TSContext, resourceName: string): boolean;
export declare class S3InputState {
    private readonly context;
    static s3InputState: S3InputState;
    _cliInputsFilePath: string;
    _resourceName: string;
    _category: string;
    _service: string;
    _inputPayload: S3UserInputs | undefined;
    buildFilePath: string;
    constructor(context: $TSContext, resourceName: string, userInput: S3UserInputs | undefined);
    getOldS3ParamsForMigration(): MigrationParams;
    inferAuthPermissions(oldParams: $TSAny): $TSAny[];
    inferGuestPermissions(oldParams: $TSAny): $TSAny[];
    genInputParametersForMigration(oldS3Params: MigrationParams): S3UserInputs;
    removeOldS3ConfigFiles(migrationParams: MigrationParams): void;
    checkNeedsMigration(): boolean;
    migrate(context: $TSContext): Promise<void>;
    cliInputFileExists(): boolean;
    checkPrefixExists(triggerPrefixList: S3TriggerPrefixType[], prefix: string): boolean;
    private _confirmLambdaTriggerPrefixUnique;
    addAdminLambdaTrigger(adminLambdaTrigger: S3UserInputTriggerFunctionParams): void;
    removeAdminLambdaTrigger(): void;
    addAdditionalLambdaTrigger(triggerFunctionParams: S3UserInputTriggerFunctionParams): void;
    getUserInput(): S3UserInputs;
    isCLIInputsValid(cliInputs?: S3UserInputs): Promise<boolean>;
    static getPermissionTypeFromCfnType(s3CFNPermissionType: S3CFNPermissionType): S3PermissionType;
    static getPermissionTypeFromStorageParamsType(s3StorageParamsPermissionType: S3StorageParamsPermissionType): S3PermissionType;
    static getCfnTypesFromPermissionType(s3PermissionType: S3PermissionType): Array<S3CFNPermissionType>;
    static getInputPermissionsFromCfnPermissions(selectedGuestPermissions: S3CFNPermissionType[] | undefined): S3PermissionType[];
    static getInputPermissionsFromStorageParamPermissions(storageParamGroupPermissions: S3StorageParamsPermissionType[] | undefined): S3PermissionType[];
    static getTriggerLambdaPermissionsFromInputPermission(triggerPermissions: S3PermissionType): S3TriggerEventType;
    static getCfnPermissionsFromInputPermissions(selectedPermissions: S3PermissionType[] | undefined): S3CFNPermissionType[];
    static getPolicyMapFromCfnPolicyMap(groupCFNPolicyMap: GroupCFNAccessType): GroupAccessType | undefined;
    static getPolicyMapFromStorageParamPolicyMap(groupStorageParamsPolicyMap: GroupStorageParamsAccessType): GroupAccessType | undefined;
    static getPolicyMapFromStorageParamsPolicyMap(groupStorageParamsPolicyMap: GroupStorageParamsAccessType): GroupAccessType | undefined;
    updateInputPayload(props: S3InputStateOptions): Promise<void>;
    static getInstance(context: $TSContext, props: S3InputStateOptions): Promise<S3InputState>;
    getCliInputPayload(): S3UserInputs;
    getCliMetadata(): S3FeatureMetadata | undefined;
    saveCliInputPayload(cliInputs: S3UserInputs): Promise<void>;
}
export {};
//# sourceMappingURL=s3-user-input-state.d.ts.map