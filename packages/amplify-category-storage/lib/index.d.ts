import { $TSAny, $TSContext, IAmplifyResource } from 'amplify-cli-core';
import { S3AccessType, S3PermissionType, S3UserInputs } from './provider-utils/awscloudformation/service-walkthrough-types/s3-user-input-types';
export { categoryName as category } from './constants';
export { S3UserInputs, S3UserInputTriggerFunctionParams, } from './provider-utils/awscloudformation/service-walkthrough-types/s3-user-input-types';
export { s3AddStorageLambdaTrigger, s3CreateStorageResource, s3GetResourceName, s3GetUserInput, s3RegisterAdminTrigger, s3RemoveAdminLambdaTrigger, s3RemoveStorageLambdaTrigger, } from './provider-utils/awscloudformation/service-walkthroughs/s3-resource-api';
export declare function s3GetBucketUserInputDefault(project: $TSAny, shortId: string, accessType: S3AccessType): Promise<S3UserInputs>;
export declare function getDefaultAuthPermissions(): Promise<S3PermissionType[]>;
export declare function add(context: any, providerName: any, service: any): Promise<any>;
export declare const console: (context: $TSContext) => Promise<void>;
export declare function migrateStorageCategory(context: any): Promise<void>;
export declare function transformCategoryStack(context: $TSContext, resource: IAmplifyResource): Promise<void>;
export declare function canResourceBeTransformed(context: $TSContext, resourceName: string): boolean;
export declare function getPermissionPolicies(context: any, resourceOpsMapping: any): Promise<{
    permissionPolicies: any;
    resourceAttributes: any;
}>;
export declare function executeAmplifyCommand(context: any): Promise<void>;
export declare const executeAmplifyHeadlessCommand: (context: $TSContext, headlessPayload: string) => Promise<void>;
export declare function handleAmplifyEvent(context: $TSContext, args: $TSAny): Promise<void>;
export declare function initEnv(context: any): Promise<void>;
//# sourceMappingURL=index.d.ts.map