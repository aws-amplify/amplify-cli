import { $TSContext } from 'amplify-cli-core';
import { S3UserInputs, S3UserInputTriggerFunctionParams } from '../service-walkthrough-types/s3-user-input-types';
export declare function s3GetResourceName(): string | undefined;
export declare function s3GetUserInput(context: $TSContext, s3ResourceName: string): Promise<S3UserInputs>;
export declare function s3GetAdminTriggerFunctionName(context: $TSContext): Promise<string | undefined>;
export declare function s3UpdateUserInput(context: $TSContext, storageInput: S3UserInputs): Promise<S3UserInputs>;
export declare function s3CreateStorageResource(context: $TSContext, storageInput: S3UserInputs): Promise<S3UserInputs>;
export declare function s3ValidateBucketName(bucketName: string): boolean;
export declare function s3AddStorageLambdaTrigger(context: $TSContext, s3ResourceName: string, storageLambdaTrigger: S3UserInputTriggerFunctionParams): Promise<S3UserInputs>;
export declare function s3RemoveStorageLambdaTrigger(context: $TSContext, s3ResourceName: string): Promise<void>;
export declare function s3RegisterAdminTrigger(context: $TSContext, s3ResourceName: string, adminLambdaTrigger: S3UserInputTriggerFunctionParams): Promise<S3UserInputs>;
export declare function s3RemoveAdminLambdaTrigger(context: $TSContext, s3ResourceName: string): Promise<S3UserInputs>;
export declare function addLambdaTrigger(context: $TSContext, s3ResourceName: string, triggerFunctionParams: S3UserInputTriggerFunctionParams): Promise<string | undefined>;
//# sourceMappingURL=s3-resource-api.d.ts.map