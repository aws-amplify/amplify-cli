import { $TSAny, $TSContext, $TSObject } from 'amplify-cli-core';
export declare function addWalkthrough(context: $TSContext, defaultValuesFilename: string, serviceMetadata: $TSObject, options: $TSObject): Promise<string | undefined>;
export declare function updateWalkthrough(context: $TSContext): Promise<string | undefined>;
export declare function isMigrateStorageRequired(context: $TSContext, resourceName: string): boolean;
export declare function migrateStorageCategory(context: $TSContext, resourceName: string): Promise<string | undefined>;
export declare function buildShortUUID(): string;
export declare function addTrigger(triggerFlowType: S3CLITriggerFlow, context: $TSContext, resourceName: string, policyID: string, existingTriggerFunction: string | undefined): Promise<string | undefined>;
export declare function createNewLambdaAndUpdateCFN(context: $TSContext, triggerFunctionName: string | undefined, policyUUID: string | undefined): Promise<string>;
export declare enum S3CLITriggerFlow {
    ADD = "TRIGGER_ADD_FLOW",
    UPDATE = "TRIGGER_UPDATE_FLOW",
    REMOVE = "TRIGGER_REMOVE_FLOW"
}
export declare enum S3CLITriggerStateEvent {
    ADD_NEW_TRIGGER = "ADD_NEW_TRIGGER",
    REPLACE_TRIGGER = "REPLACE_TRIGGER",
    DELETE_TRIGGER = "DELETE_TRIGGER",
    ERROR = "TRIGGER_ERROR",
    NO_OP = "TRIGGER_NO_OP"
}
export declare const resourceAlreadyExists: () => undefined;
export declare function checkIfAuthExists(): boolean;
export declare function getIAMPolicies(resourceName: $TSAny, crudOptions: $TSAny): {
    policy: {}[];
    attributes: string[];
};
//# sourceMappingURL=s3-walkthrough.d.ts.map