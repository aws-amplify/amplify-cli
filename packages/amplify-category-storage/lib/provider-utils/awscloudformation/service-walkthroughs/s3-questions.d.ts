import { $TSAny, $TSContext } from 'amplify-cli-core';
import { S3AccessType, S3PermissionType, S3TriggerFunctionType, S3UserAccessRole, S3UserInputs } from '../service-walkthrough-types/s3-user-input-types';
import { S3PermissionMapType } from './s3-user-input-state';
export declare const permissionMap: S3PermissionMapType;
export declare enum S3CLITriggerUpdateMenuOptions {
    ADD = "Add the Trigger",
    UPDATE = "Update the Trigger",
    REMOVE = "Remove the Trigger",
    SKIP = "Skip Question"
}
export declare enum UserPermissionTypeOptions {
    AUTH_GUEST_USERS = "Auth/Guest Users",
    INDIVIDUAL_GROUPS = "Individual Groups",
    BOTH = "Both",
    LEARN_MORE = "Learn more"
}
export declare const possibleCRUDOperations: {
    name: string;
    value: S3PermissionType;
}[];
export declare function askAndOpenFunctionEditor(context: $TSContext, functionName: string): Promise<void>;
export declare function askTriggerFunctionTypeQuestion(): Promise<S3TriggerFunctionType>;
export declare function askSelectExistingFunctionToAddTrigger(choicesLambdaResources: Array<string>): Promise<string>;
export declare function askAndInvokeAuthWorkflow(context: $TSContext): Promise<void>;
export declare function askResourceNameQuestion(context: $TSContext, defaultValues: $TSAny): Promise<string>;
export declare function askBucketNameQuestion(context: $TSContext, defaultValues: S3UserInputs): Promise<string>;
export declare function askWhoHasAccessQuestion(context: $TSContext, defaultValues: S3UserInputs): Promise<S3AccessType>;
export declare function askCRUDQuestion(role: S3UserAccessRole, groupName: string | undefined, context: $TSContext, defaultValues: S3UserInputs): Promise<Array<S3PermissionType>>;
export declare function askUserPoolGroupSelectionQuestion(userPoolGroupList: Array<string>, context: $TSContext, defaultValues: S3UserInputs): Promise<string[]>;
export declare function askUserPoolGroupPermissionSelectionQuestion(): Promise<UserPermissionTypeOptions>;
export declare function askUpdateTriggerSelection(currentTriggerFunction?: string | undefined): Promise<S3CLITriggerUpdateMenuOptions>;
export declare function askAuthPermissionQuestion(context: $TSContext, defaultValues: S3UserInputs): Promise<S3PermissionType[]>;
export declare function conditionallyAskGuestPermissionQuestion(storageAccess: S3AccessType | undefined, context: $TSContext, defaultValues: $TSAny): Promise<S3PermissionType[]>;
export declare function askGroupPermissionQuestion(groupName: string, context: $TSContext, defaultValues: $TSAny): Promise<S3PermissionType[]>;
export declare function askUserPoolGroupSelectionUntilPermissionSelected(userPoolGroupList: string[]): Promise<string>;
export declare function askGroupOrIndividualAccessFlow(userPoolGroupList: Array<string>, context: $TSContext, cliInputs: S3UserInputs): Promise<S3UserInputs>;
export declare function normalizePermissionsMapValue(permissionValue: Array<S3PermissionType>): S3PermissionType;
//# sourceMappingURL=s3-questions.d.ts.map